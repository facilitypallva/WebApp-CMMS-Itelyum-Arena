const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_DELAY_MS = 800;

export function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  message = 'Timeout richiesta'
) {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    let settled = false;

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, timeoutMs);

    operation(controller.signal)
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export function sleep(delayMs = DEFAULT_RETRY_DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export async function retryRequest<T>(
  operation: () => Promise<T>,
  label = 'request',
  retryDelayMs = DEFAULT_RETRY_DELAY_MS
) {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${label} failed on first attempt, retrying once`, error);
    await sleep(retryDelayMs);
    return operation();
  }
}

export async function runResilientRequest<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options?: {
    label?: string;
    timeoutMs?: number;
    timeoutMessage?: string;
    retryDelayMs?: number;
  }
) {
  const {
    label = 'request',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    timeoutMessage = 'Timeout richiesta',
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  } = options ?? {};

  return retryRequest(
    () => withRequestTimeout(operation, timeoutMs, timeoutMessage),
    label,
    retryDelayMs
  );
}
