import { scheduleAfterPaint } from "./list";

/** Paint SSR first, but install handlers before the first interaction reaches them. */
export function startAfterPaint(start: () => void) {
	const pending = new AbortController();
	let started = false;
	const run = () => {
		if (started) return;
		started = true;
		pending.abort();
		start();
	};
	const interact = (event: Event) => {
		// Input/change can arrive without an earlier key or pointer event
		// (autofill, accessibility tools). Initial bindings must not erase the
		// edited value before the original event reaches its newly bound handler.
		const target = event.target;
		const edited = event.type === "input" || event.type === "change";
		const activated =
			event.type === "click" &&
			target instanceof HTMLInputElement &&
			(target.type === "checkbox" || target.type === "radio");
		let restore = () => {};
		if (
			edited &&
			(target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement)
		) {
			const value = target.value;
			const checked =
				target instanceof HTMLInputElement ? target.checked : false;
			const indeterminate =
				target instanceof HTMLInputElement ? target.indeterminate : false;
			const { selectionStart, selectionEnd, selectionDirection } = target;
			restore = () => {
				target.value = value;
				if (target instanceof HTMLInputElement) {
					target.checked = checked;
					target.indeterminate = indeterminate;
				}
				if (selectionStart !== null && selectionEnd !== null) {
					target.setSelectionRange(
						selectionStart,
						selectionEnd,
						selectionDirection ?? undefined,
					);
				}
			};
		} else if (edited && target instanceof HTMLSelectElement) {
			const selected = [...target.options].map((option) => option.selected);
			restore = () => {
				[...target.options].forEach((option, i) => {
					option.selected = selected[i] ?? false;
				});
			};
		}
		// Click activation updates checked state before capture listeners run.
		// Radio activation also unchecks peers, so preserve the entire group.
		const checkables = activated
			? [
					...(
						target.getRootNode() as ParentNode
					).querySelectorAll<HTMLInputElement>(
						'input[type="checkbox"], input[type="radio"]',
					),
				]
					.filter(
						(input) =>
							input === target ||
							(target.type === "radio" &&
								input.type === "radio" &&
								input.name === target.name &&
								input.form === target.form),
					)
					.map((input) => ({
						input,
						checked: input.checked,
						indeterminate: input.indeterminate,
					}))
			: [];
		run();
		restore();
		for (const { input, checked, indeterminate } of checkables) {
			input.checked = checked;
			input.indeterminate = indeterminate;
		}
	};
	for (const type of [
		"pointerdown",
		"keydown",
		"focusin",
		"click",
		"submit",
		"input",
		"change",
	]) {
		document.addEventListener(type, interact, {
			capture: true,
			signal: pending.signal,
		});
	}
	scheduleAfterPaint(run);
}
