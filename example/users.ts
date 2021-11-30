import * as Ably from 'ably';
import { Stats } from '@ably-labs/locust';

class User {
  stats?: Stats = undefined;
  startTime: number = 0;
  client?: Ably.Realtime = undefined;

  constructor(stats: Stats) {
    this.stats = stats;
  }

  private newRealtime(): Ably.Realtime {
    let opts: Ably.Types.ClientOptions = {
      key: process.env.ABLY_API_KEY,
      realtimeHost: process.env.ABLY_REALTIME_HOST || undefined,
      restHost: process.env.ABLY_REST_HOST || undefined
    };

    return new Ably.Realtime(opts);
  }

  start() {
    this.startTime = Date.now();
    this.client = this.newRealtime();
  }

  stop() {
    this.client?.close();
  }
}

export class Subscriber extends User {
  constructor(stats: Stats) {
    super(stats)
  }

  start() {
    super.start();
    this.client?.channels.get('example').subscribe(this.logSubscribe.bind(this));
  }

  logSubscribe(message: Ably.Types.Message) {
    this.stats?.logRequest('subscribe', Date.now() - message.timestamp);
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
    this.channel = this.client?.channels.get('example');
    this.publisher = setInterval(this.publish.bind(this), 1000);
  }

  stop() {
    super.stop();
    if(this.publisher) {
      clearInterval(this.publisher);
    }
  }

  publish() {
    const publishedAt = Date.now();
    this.channel?.publish('foo', 'bar', (err) => this.logPublish(err, publishedAt));
  }

  logPublish(err: Ably.Types.ErrorInfo | null | undefined, publishedAt: number) {
    if (err) {
      this.stats?.logError('publish', `Error publishing message: ${err}`);
      return;
    }
    this.stats?.logRequest('publish', Date.now() - publishedAt);
  }
}
