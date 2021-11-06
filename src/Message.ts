import * as zeromq from 'zeromq';

/* Locust expects response time stats to be sent as a Map<number,number>, but
 * many msgpack libraries (e.g. '@msgpack/msgpack') convert a Map<number,number>
 * into a Map<string,number>, which breaks the stats reporting.
 *
 * msgpack5 seems to be the only library that supports encoding a
 * Map<number,number> without string conversion, so we use that one.
 */
import msgpack5 from 'msgpack5';
const msgpack = msgpack5();

/**
 * The type of a Locust protocol message.
 */
export const enum MessageType {
  ClientReady = 'client_ready',
  ClientStopped = 'client_stopped',
  Heartbeat = 'heartbeat',
  Stats = 'stats',
  Spawn = 'spawn',
  Spawning = 'spawning',
  SpawningComplete = 'spawning_complete',
  Stop = 'stop',
  Quit = 'quit',
  Exception = 'exception',
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
  workerID: string;

  /**
   * Decode a Message from a ZeroMQ message, which is expected to contain a
   * msgpack encoded 3-element array like [type, data, workerID].
   */
  static decode(msg: zeromq.Message): Message {
    const data = msgpack.decode(msg);

    if (!Array.isArray(data) || data.length !== 3) {
      throw new Error(`expected msgpack encoding to be a 3-element array, got ${data}`);
    }

    return new Message(data[0], data[1], data[2]);
  }

  constructor(type: MessageType, data: unknown, workerID: string) {
    this.type = type;
    this.data = data;
    this.workerID = workerID;
  }

  /**
   * Encode the Message as a msgpack 3-element array.
   */
  encode(): Buffer {
    return msgpack.encode([this.type, this.data, this.workerID]).slice();
  }
}
