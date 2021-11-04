import { Worker } from '../src';
import { waitUntil, LocustProcess } from './helpers';

let locust: LocustProcess;

beforeEach(() => {
  locust = new LocustProcess();
  return locust.start();
});

afterEach(() => {
  return locust.stop();
});

test('connect to Locust', () => {
  // run a worker
  const worker = new Worker({
    worker_id: 'test',
    uri: locust.zeromq_uri,
  });
  worker.run();

  // check the worker appears in Locust stats within 10s
  const workerIsConnected = async () => {
    const stats = await locust.stats();
    return stats.workers && stats.workers.length == 1;
  }
  return waitUntil(workerIsConnected, 500, 10000);
});
