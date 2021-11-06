const Ably = require('ably');

class Subscriber {
  constructor(stats) {
    this.stats = stats;
  }

  start() {
    this.startTime = Date.now();

    this.client = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

    this.client.channels.get('example').subscribe(this.logSubscribe.bind(this));
  }

  stop() {
    this.client.close();
  }

  logSubscribe(message) {
    this.stats.logRequest('subscribe', Date.now() - message.timestamp);
  }
}

class Publisher {
  constructor(stats) {
    this.stats = stats;
  }

  start() {
    this.startTime = Date.now();

    this.client = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

    this.channel = this.client.channels.get('example');

    this.publisher = setInterval(this.publish.bind(this), 1000);
  }

  stop() {
    clearInterval(this.publisher);
    this.client.close();
  }

  publish() {
    const publishedAt = Date.now();
    this.channel.publish('foo', 'bar', (err) => this.logPublish(err, publishedAt));
  }

  logPublish(err, publishedAt) {
    if (err) {
      this.stats.logError('publish', `Error publishing message: ${err}`);
      return;
    }
    this.stats.logRequest('publish', Date.now() - publishedAt);
  }
}

module.exports.Subscriber = Subscriber;
module.exports.Publisher = Publisher;
