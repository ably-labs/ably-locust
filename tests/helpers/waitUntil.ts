import { sleep } from './sleep';

/**
 * Wait until the given check resolves to true, checking it at the given
 * interval, but no longer than the given timeout.
 */
export const waitUntil = async (check: () => Promise<boolean>, interval: number, timeout: number) => {
  let timedOut = false;

  const timeoutID = setTimeout(() => { timedOut = true; }, timeout);

  while(!timedOut) {
    if(await check()) {
      clearTimeout(timeoutID);
      return;
    }
    await sleep(interval);
  }

  throw new Error('timed out waiting for check to return true');
}
