// An example demonstrating how to use @ably-labs/locust to connect to Locust and
// start users during a load test.

const { hostname } = require('os');
const { Worker } = require('@ably-labs/locust');

const worker = new Worker({
  locustUri: 'tcp://locust:5557',
  workerID:  `example-${hostname()}`,
  logLevel:  'debug',
});

// Register a function to intialise users for each user class defined in
// locustfile.py
const { Publisher, Subscriber } = require('./users');
worker.register('Subscriber', () => new Subscriber(worker.stats));
worker.register('Publisher',  () => new Publisher(worker.stats));

// Quit the worker when receiving a termination signal.
process.on('SIGTERM', () => worker.quit());
process.on('SIGINT', () => worker.quit());

// Run the worker until it quits.
worker.run();
