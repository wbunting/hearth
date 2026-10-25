// Cooperative speculative work. Each hydration step/item gets its own job;
// a region can drain the remaining jobs synchronously if navigation wins.
import type { Scope } from "../scope";

const owners = new WeakMap<Scope, IdleWork>();
let synchronous = 0;

/** Render replacements must discover signals/dependencies before returning. */
export function synchronously<T>(fn: () => T): T {
	synchronous++;
	try {
		return fn();
	} finally {
		synchronous--;
	}
}

export function idleWork(scope: Scope): IdleWork | undefined {
	if (synchronous) return undefined;
	for (let s: Scope | null = scope; s; s = s.parent) {
		const work = owners.get(s);
		if (work) return work;
	}
	return undefined;
}

export class IdleWork {
	private jobs: (() => void)[] = [];
	private scheduled = false;
	private draining = false;
	failed = false;

	constructor(
		private scope: Scope,
		associate = true,
	) {
		if (associate) owners.set(scope, this);
		scope.abortSignal.addEventListener("abort", () => {
			this.jobs.length = 0;
			if (owners.get(scope) === this) owners.delete(scope);
		});
	}

	add(job: () => void) {
		if (this.scope.isDisposed) return;
		this.jobs.push(job);
		if (!this.scheduled && !this.draining) {
			this.scheduled = true;
			const post = () => {
				const scheduler = (globalThis as any).scheduler;
				if (scheduler?.postTask)
					void scheduler.postTask(() => this.slice(), {
						priority: "background",
					});
				else if (typeof (globalThis as any).requestIdleCallback === "function")
					requestIdleCallback(() => this.slice());
				else setTimeout(() => this.slice(), 0);
			};
			if (document.readyState === "complete") post();
			else
				window.addEventListener("load", post, {
					once: true,
					signal: this.scope.abortSignal,
				});
		}
	}

	/** Failed speculative content must be rebuilt with valid live values. */
	reportError(error: unknown) {
		this.failed = true;
		this.scope.runtime.reportError(error);
	}

	private run(job: () => void) {
		try {
			job();
		} catch (error) {
			this.reportError(error);
		}
	}

	private slice() {
		this.scheduled = false;
		if (this.scope.isDisposed) return;
		const until = performance.now() + 4;
		this.draining = true;
		try {
			do {
				const job = this.jobs.shift();
				if (job) this.run(job);
			} while (this.jobs.length && performance.now() < until);
		} finally {
			this.draining = false;
		}
		if (this.jobs.length) {
			// Schedule another task, not a microtask: input and paint go first.
			this.add(() => {});
		}
	}

	/** Completes partial hydration before making a region interactive. */
	finish() {
		this.draining = true;
		try {
			while (this.jobs.length && !this.scope.isDisposed)
				this.run(this.jobs.shift()!);
		} finally {
			this.draining = false;
			owners.delete(this.scope);
		}
	}
}
