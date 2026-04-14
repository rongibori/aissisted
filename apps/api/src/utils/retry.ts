/**
 * Retry a promise-returning function with exponential backoff.
 *
 * @param fn        Function to retry
 * @param retries   Max attempts after first failure (default 3 → 4 total)
 * @param baseMs    Initial delay in ms (doubles each attempt, default 500)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseMs = 500
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseMs * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  throw lastErr;
}
