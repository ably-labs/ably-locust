# ably-locust

A JavaScript load generator for [Locust.io](https://locust.io).

---

_[Ably](https://ably.com) is the platform that powers synchronized digital experiences in realtime. Whether attending an event in a virtual venue, receiving realtime financial information, or monitoring live car performance data – consumers simply expect realtime digital experiences as standard. Ably provides a suite of APIs to build, extend, and deliver powerful digital experiences in realtime for more than 250 million devices across 80 countries each month. Organizations like Bloomberg, HubSpot, Verizon, and Hopin depend on Ably’s platform to offload the growing complexity of business-critical realtime data synchronization at global scale. For more information, see the [Ably documentation](https://ably.com/documentation)._

---

## Quick Start

See [example/users.ts](/example/users.ts) for an example of defining Locust users in TypeScript, and [example/index.ts](/example/index.ts) for an example program which connects to a Locust master and runs the defined users during a load test.

The example can be run by copying `example/.env.sample` to `example/.env`, setting `ABLY_API_KEY` to your Ably API key, and running [Docker Compose](https://docs.docker.com/compose/):

```
cd example

cp .env.sample .env

# ... edit ABLY_API_KEY in .env ...

docker compose up --build
```

Visit the Locust web UI at http://localhost:8089, start a load test, and you should see `subscribe` and `publish` events reported by the JavaScript users.

## Locust

[Locust](https://locust.io) is an open source load testing tool which supports two modes of operation. The first is standalone mode where there is a single Locust process generating the load, collecting statistics, and serving the web UI, and the second is distributed mode where there is a Locust master process serving the web UI, but also exposing a ZeroMQ socket to communicate with Locust worker processes which generate the load and report statistics back to the Locust master. `ably-locust` expects Locust to be running in distributed mode.

Locust has the concept of a User which runs a set of requests during a load test. The User periodically reports statistics about those tasks which appear in the web UI (e.g. if they succeed or fail, what latency is encountered, the content size, etc.). Locust Users are typically defined in Python code in a file named `locustfile.py` and passed to Locust as a command line flag, whereas Users are defined in JavaScript code when using `ably-locust`.

## Usage

`ably-locust` is an implementation of a Locust worker process in JavaScript. It can be installed by running:

```
npm install @ably-labs/locust
```

Rather than being a program which accepts user definitions via a command line flag like a Locust Python worker, `ably-locust` is a library which is used within a containing program which also includes the user definition.

The `Worker` class is instantiated with the URI of the Locust master ZeroMQ socket, and a function is registered with the worker to instantiate each of the user classes the Locust master is configured with (i.e. any classes in the `locustfile.py` passed to the Locust master which inherit from the Locust `User` class, see [here](http://docs.locust.io/en/stable/writing-a-locustfile.html#user-class)). The worker then interacts with the Locust master by sending and receiving msgpack-encoded messages over the ZeroMQ socket.

One of the messages a worker receives is a `spawn` message which declares how many users of each class should be running at any given time, and the worker responds by starting and/or stopping users as appropriate.

For example, assuming there is a Locust master running at `locust.example.com:5557` which is using the following `locustfile.py`:

```
from locust import User

class ExampleUser(User):
    pass
```

Then here's an example program where each user reports a successful request every second:

```
const { Worker } = require('@ably-labs/locust');

const worker = new Worker({
  locustUri: 'tcp://locust.example.com:5557',
  workerID:  'my-worker-123',
});

class User {
  start() {
    this.interval = setInterval(() => {
      const latency = 100;
      const contentLength = 1024;
      worker.stats.logRequest('my-request-type', latency, contentLength);
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
  }
}

worker.register('ExampleUser', () => new User());

worker.run();
```

## Testing

Start an instance of Locust and run the tests:

```
cd tests

docker compose up --build

npm test
```
