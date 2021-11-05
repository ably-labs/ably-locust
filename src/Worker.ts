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
 * The data attached to a 'spawn' protocol message which is sent from the
 * Locust master to a worker to inform it of how may users of different
 * classes should be running.
 */
interface SpawnData {
  user_classes_count: {
    [key: string]: number;
  };
}

/**
 * Assert that data received in a 'spawn' protocol message has the correct
 * type.
 */
const isSpawnData = (data: unknown): data is SpawnData => {
  return (data as SpawnData).user_classes_count !== undefined
}

/**
 * A User that is started and stopped during a load test.
 */
interface User {
  start(): void;
  stop(): void;
}

/**
 * A function which is registered with a worker to initialise a User.
 */
type UserFn = () => User;

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

  /**
   * A map of user class names to functions used to initialise those users.
   */
  userFns: { [key: string]: UserFn };

  /**
   * A map of user class names to the list of running users for each of those
   * classes.
   */
  users: { [key: string]: Array<User> };

  constructor(opts: Options) {
    this.id = opts.worker_id;
    this.uri = opts.uri;
    this.dealer = new Dealer({ routingId: this.id });
    this.userFns = {};
    this.users = {};
  }

  /**
   * Register a function to initialise users of the given class name.
   */
  register(userClass: string, userFn: () => User) {
    this.userFns[userClass] = userFn;
  }

  /**
   * Run the main worker loop:
   *
   * - connect to the Locust master
   * - send a 'client_ready' message
   * - process incoming messages
   *
   */
  async run() {
    await this.dealer.connect(this.uri);

    await this.send(MessageType.ClientReady, PROTOCOL_VERSION);

    for await (const [data] of this.dealer) {
      try {
        const msg = Message.decode(data);

        this.handle(msg);
      } catch(err) {
        console.error(`Error handling incoming message: ${err}`)
      }
    }
  }

  /**
   * Send a protocol message to the Locust master.
   */
  send(type: MessageType, data: any) {
    const msg = new Message(type, data, this.id);

    return this.dealer.send(msg.encode());
  }

  /**
   * Handle an incoming message from the Locust master.
   */
  handle(msg: Message) {
    switch (msg.type) {
      case MessageType.Spawn:
        if(isSpawnData(msg.data)) {
          this.handleSpawn(msg.data)
        } else {
          throw new Error('Invalid spawn data, missing "user_classes_count"')
        }
        break;
      case MessageType.Stop:
        this.handleStop();
        break;
      case MessageType.Quit:
        this.handleQuit();
        break;
      default:
        throw new Error(`Unknown message type: ${msg.type}`);
    }
  }

  /**
   * Handle a 'spawn' protocol message by ensuring that the number of running
   * users matches the number in the given spawn data.
   */
  handleSpawn(data: SpawnData) {
    for (const userClass in data.user_classes_count) {
      // check we have a registered function for the given class
      const userFn = this.userFns[userClass];
      if(userFn === undefined) {
        console.log(`WARN: no function has been registered for the '${userClass}' user class, skipping those users`);
        continue;
      }

      // initialise the user list for the given class
      if (this.users[userClass] === undefined) {
        this.users[userClass] = [];
      }

      // start or stop users based on the spawn data
      const expectedCount = data.user_classes_count[userClass];
      const actualCount = this.users[userClass].length;
      if (expectedCount > actualCount) {
        this.startUsers(userClass, userFn, expectedCount - actualCount);
      } else if (expectedCount < actualCount) {
        this.stopUsers(userClass, actualCount - expectedCount);
      }
    }
  }

  /**
   * Handle a 'stop' protocol message by stopping all users.
   */
  handleStop() {
    this.stopAll();
  }

  /**
   * Handle a 'quit' protocol message by stopping all users and closing the
   * ZeroMQ socket.
   */
  async handleQuit() {
    this.stopAll();
    await this.dealer.close()
  }

  /**
   * Start the given number of users.
   */
  startUsers(userClass: string, userFn: UserFn, count: number) {
    for (let i = 0; i < count; i++) {
      const user = userFn();
      user.start();
      this.users[userClass].push(user);
    }
  }

  /**
   * Stop the given number of users.
   */
  stopUsers(userClass: string, count: number) {
    for (let i = 0; i < count; i++) {
      const user = this.users[userClass].pop();
      if(user !== undefined) {
        user.stop();
      }
    }
  }

  /**
   * Stop all users.
   */
  stopAll() {
    for (const userClass in this.users) {
      this.stopUsers(userClass, this.users[userClass].length)
    }
  }
}
