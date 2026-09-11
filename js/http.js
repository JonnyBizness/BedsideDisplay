import { CONFIG } from './config.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timed out');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getJSON(url) {
  const { timeoutMs, retries, retryBackoffMs } = CONFIG.HTTP;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetchOnce(url, timeoutMs);
    } catch (error) {
      if (attempt >= retries) throw error;
      // Exponential backoff: a failure here is usually the far end
      // restarting or rate-limiting, and hammering it does not help.
      await sleep(retryBackoffMs * (2 ** attempt));
    }
  }
}

export const query = (params) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
