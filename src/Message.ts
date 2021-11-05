import * as msgpack from '@msgpack/msgpack';
import * as zeromq from 'zeromq';

/**
 * The type of a Locust protocol message.
 */
export const enum MessageType {
  ClientReady = 'client_ready',
  Heartbeat = 'heartbeat',
  Stats = 'stats',
  Spawn = 'spawn',
  Stop = 'stop',
  Quit = 'quit',
}

/**
 * A Locust protocol Message sent over a ZeroMQ socket.
 */
export class Message {
  /**
   * The protocol message type.
   */
  type: MessageType;

  /**
   * The protocol message data.
   */
  data: unknown;

  /**
   * The ID of the worker this message is either sent to or sent by.
   */
  worker_id: string;

  /**
   * Decode a Message from a ZeroMQ message, which is expected to contain a
   * msgpack encoded 3-element array like [type, data, worker_id].
   */
  static decode(msg: zeromq.Message): Message {
    const data = msgpack.decode(msg);

    if(!Array.isArray(data) || data.length != 3) {
      throw new Error(`expected msgpack encoding to be a 3-element array, got ${data}`);
    }

    return new Message(data[0], data[1], data[2]);
  }

  constructor(type: MessageType, data: unknown, worker_id: string) {
    this.type = type;
    this.data = data;
    this.worker_id = worker_id;
  }

  /**
   * Encode the Message as a msgpack 3-element array.
   */
  encode(): Uint8Array {
    return msgpack.encode([this.type, this.data, this.worker_id]);
  }
}
