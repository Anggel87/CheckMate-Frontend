import { Observable } from 'rxjs';

export interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Reads a Server-Sent Events stream via fetch() instead of the native EventSource, because
 * EventSource cannot send an Authorization header and this API is Bearer-token authenticated.
 */
export function fetchEventStream(url: string, headers: Record<string, string>): Observable<SseEvent> {
  return new Observable<SseEvent>((subscriber) => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(url, { headers, signal: controller.signal });

        if (!response.ok || !response.body) {
          subscriber.error(new Error(`SSE request failed with status ${response.status}`));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const parsed = parseFrame(frame);

            if (parsed) {
              subscriber.next(parsed);
            }
          }
        }

        subscriber.complete();
      } catch (error) {
        if (controller.signal.aborted) {
          subscriber.complete();
        } else {
          subscriber.error(error);
        }
      }
    })();

    return () => controller.abort();
  });
}

function parseFrame(frame: string): SseEvent | null {
  let event = 'message';
  let dataLine: string | null = null;

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLine = line.slice(5).trim();
    }
  }

  if (dataLine === null) {
    return null;
  }

  try {
    return { event, data: JSON.parse(dataLine || '{}') };
  } catch {
    return null;
  }
}
