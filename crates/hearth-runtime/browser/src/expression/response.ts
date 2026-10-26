import { readFrames } from "../render/frames";
import { loadExpressions } from "./compile";

/** Keeps the dev client's synchronous replacement hooks safe with new code. */
export function expressionResponse(
	response: Response,
	signal: AbortSignal,
): Response {
	const frames = readFrames(response);
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const next = await frames.next();
				if (signal.aborted || next.done) {
					controller.close();
					return;
				}
				const frame = next.value;
				if (frame.t === "snapshot" || frame.t === "swap")
					await loadExpressions(frame.html, frame.t === "snapshot");
				if (signal.aborted) {
					controller.close();
					return;
				}
				controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
			} catch (error) {
				controller.error(error);
			}
		},
		async cancel() {
			await frames.return(undefined);
		},
	});
	return new Response(stream, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
}
