import * as Ably from 'ably';
import { Stats } from '@ably-labs/locust';

class User {
  stats: Stats;
  startTime: number = 0;
  client?: Ably.Realtime = undefined;

  constructor(stats: Stats) {
    this.stats = stats;
  }

  start() {
    this.startTime = Date.now();
    this.client = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      environment: process.env.ABLY_ENV || undefined
    });
  }

  stop() {
    this.client!.close();
  }
}

export class Subscriber extends User {
  constructor(stats: Stats) {
    super(stats)
  }

  start() {
    super.start();
    this.client!.channels.get('example').subscribe(this.logSubscribe.bind(this));
  }

  logSubscribe(message: Ably.Types.Message) {
    this.stats!.logRequest('subscribe', Date.now() - message.timestamp);
  }
}

export class Publisher extends User {
  channel?: Ably.Types.RealtimeChannelCallbacks;
  publisher?: NodeJS.Timer;

  constructor(stats: Stats) {
    super(stats)
  }

  start() {
    super.start();
    this.channel = this.client!.channels.get('example');
    this.publisher = setInterval(this.publish.bind(this), 1000);
  }

  stop() {
    super.stop();
    clearInterval(this.publisher!);
  }

  publish() {
    const publishedAt = Date.now();
    this.channel!.publish('foo', 'bar', (err) => this.logPublish(err, publishedAt));
  }

  logPublish(err: Ably.Types.ErrorInfo | null | undefined, publishedAt: number) {
    if (err) {
      this.stats!.logError('publish', `Error publishing message: ${err}`);
      return;
    }
    this.stats!.logRequest('publish', Date.now() - publishedAt);
  }
}
