import { Worker } from '../src';
import { waitUntil, LocustProcess } from './helpers';

jest.setTimeout(15000);

export const zeromq_uri = 'tcp://127.0.0.1:5557';

let locust: LocustProcess = new LocustProcess();

test('run a load test', async () => {
  // create a worker
  const worker = new Worker({
    locustUri: zeromq_uri,
    workerID:  'test',
  });

  // register a TestUser which increases/decreases userCount when it
  // starts/stops.
  let userCount = 0;
  worker.register('TestUser', () => ({
    start: () => {
      userCount += 1;
    },
    stop: () => {
      userCount -= 1;
    },
  }));

  // run the worker
  worker.run();

  // check the worker appears in Locust stats within 10s
  const workerIsConnected = async () => {
    const stats = await locust.stats();
    return stats.workers && stats.workers.length == 1;
  }
  await waitUntil(workerIsConnected, 500, 10000);

  // start a 10 user load test
  await locust.startLoadTest({ user_count: 10, spawn_rate: 10 });

  // check 10 users start
  const userCountIs = (count: number) => async () => userCount === count;
  await waitUntil(userCountIs(10), 500, 10000);

  // stop the load test
  await locust.stopLoadTest();

  // check 10 users stop
  await waitUntil(userCountIs(0), 500, 10000);

  // stop the worker
  await worker.quit();
});
