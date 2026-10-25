/** Resolves against the document, not the runtime asset (which may be on a CDN). */
import type { Context } from "./context";
export function importExpressions(
	path: string,
): Promise<{
	default: Record<string, (cx: Context, captures: unknown) => unknown>;
}> {
	return import(/* @vite-ignore */ expressionModuleUrl(path));
}

export function expressionModuleUrl(path: string): string {
	return new URL(path, window.location.origin).href;
}
