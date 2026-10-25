/** SSR stays visible but cannot accept edits until its expression code is ready. */
export async function bootExpressions(
	load: () => Promise<void>,
	start: () => void,
): Promise<void> {
	const body = document.body;
	const inert = body.inert;
	body.inert = true;
	body.setAttribute("aria-busy", "true");
	try {
		await load();
		start();
	} finally {
		body.inert = inert;
		body.removeAttribute("aria-busy");
	}
}
