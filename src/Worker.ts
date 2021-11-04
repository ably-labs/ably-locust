import { Dealer } from 'zeromq'
import { PROTOCOL_VERSION } from './constants'
import { Message, MessageType } from './message'

/**
 * Options for initialising a Worker.
 *
 * @typeparam uri The URI of the Locust master ZeroMQ socket.
 * @typeparam worker_id The worker_id sent in every protocol message.
 */
interface Options {
  uri: string;
  worker_id: string;
}

/**
 * A Locust worker which connects to a Locust master ZeroMQ socket and spawns
 * Locust users during an active load test.
 */
export class Worker {
  /**
   * The ID of the worker which is used as the worker_id in all protocol
   * messages sent by this worker.
   */
  id: string;

  /**
   * The URI of the Locust master ZeroMQ socket.
   */
  uri: string;

  /**
   * The ZeroMQ dealer socket used to send and receive protocol messages from
   * the Locust master.
   */
  dealer: Dealer;

  constructor(opts: Options) {
    this.id = opts.worker_id;
    this.uri = opts.uri;
    this.dealer = new Dealer({ routingId: this.id });
  }

  /**
   * Run the main worker loop:
   *
   * - connect to the Locust master
   * - send a 'client_ready' message
   *
   */
  async run() {
    await this.dealer.connect(this.uri);

    await this.send(MessageType.ClientReady, PROTOCOL_VERSION);
  }

  /**
   * Send a protocol message to the Locust master.
   */
  send(type: MessageType, data: any) {
    const msg = new Message(type, data, this.id);

    return this.dealer.send(msg.encode());
  }
}
