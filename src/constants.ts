/**
 * The Locust protocol version the worker implements.
 *
 * This is communicated to the Locust master in the 'client_ready' protocol
 * message, and the Locust master expects it to match its own running version.
 *
 * See https://github.com/locustio/locust/blob/2.4.3/locust/runners.py#L879-L886
 */
export const PROTOCOL_VERSION = '2.4.3';

/**
 * The interval between successive heartbeats.
 */
export const HEARTBEAT_INTERVAL = 1000;
