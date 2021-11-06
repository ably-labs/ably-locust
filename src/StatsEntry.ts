/**
 * A named stats entry which appears as a single row in the Locust web UI.
 */
export class StatsEntry {
  name: string;
  numRequests: number;
  numNoneRequests: number;
  numFailures: number;
  totalResponseTime: number;
  minResponseTime: number | null;
  maxResponseTime: number;
  numReqsPerSec: Map<number, number>;
  numFailPerSec: Map<number, number>;
  responseTimes: Map<number, number>;
  totalContentLength: number;
  startTime: number;
  lastRequestTimestamp: number | null;

  constructor(name: string) {
    this.name = name;
    this.numRequests = 0;
    this.numNoneRequests = 0;
    this.numFailures = 0;
    this.totalResponseTime = 0;
    this.minResponseTime = null;
    this.maxResponseTime = 0;
    this.numReqsPerSec = new Map();
    this.numFailPerSec = new Map();
    this.responseTimes = new Map();
    this.totalContentLength = 0;
    this.startTime = Date.now();
    this.lastRequestTimestamp = null;
  }

  /**
   * Reset the stats, typically called during collection.
   */
  reset() {
    this.numRequests = 0;
    this.numNoneRequests = 0;
    this.numFailures = 0;
    this.totalResponseTime = 0;
    this.minResponseTime = null;
    this.maxResponseTime = 0;
    this.numReqsPerSec = new Map();
    this.numFailPerSec = new Map();
    this.responseTimes = new Map();
    this.totalContentLength = 0;
    this.startTime = Date.now();
    this.lastRequestTimestamp = null;
  }

  /**
   * Log the response time and content length of a successful request.
   */
  log(responseTime?: number, contentLength?: number) {
    const now = Date.now();
    const ts = Math.floor(now / 1000);

    this.numRequests += 1;

    this.numReqsPerSec.set(ts, (this.numReqsPerSec.get(ts) || 0) + 1);

    this.lastRequestTimestamp = now;

    if (!responseTime) {
      this.numNoneRequests += 1;
      return;
    }

    this.totalResponseTime += responseTime;

    if (!this.minResponseTime) {
      this.minResponseTime = responseTime;
    }

    this.minResponseTime = Math.min(this.minResponseTime, responseTime);
    this.maxResponseTime = Math.max(this.maxResponseTime, responseTime);

    // to avoid too much data that has to be transferred to the master node when
    // running in distributed mode, we save the response time rounded in a dict
    // so that 147 becomes 150, 3432 becomes 3400 and 58760 becomes 59000
    const roundedResponseTime = Number(responseTime.toPrecision(2));
    this.responseTimes.set(roundedResponseTime, (this.responseTimes.get(roundedResponseTime) || 0) + 1);

    if (contentLength) {
      this.totalContentLength += contentLength;
    }
  }

  /**
   * Log an error.
   */
  logError() {
    const now = Date.now();
    const ts = Math.floor(now / 1000);

    this.numFailures += 1;

    this.numFailPerSec.set(ts, (this.numFailPerSec.get(ts) || 0) + 1);
  }

  /**
   * Collect the current stats and reset them to zero.
   */
  collect() {
    const encoded = this.encode();
    this.reset();
    return encoded;
  }

  /**
   * Encode the stats into the format Locust expects.
   */
  encode() {
    return {
      name: this.name,
      method: 'ably-locust',
      num_requests: this.numRequests,
      num_none_requests: this.numNoneRequests,
      num_failures: this.numFailures,
      total_response_time: this.totalResponseTime,
      min_response_time: this.minResponseTime,
      max_response_time: this.maxResponseTime,
      num_reqs_per_sec: this.numReqsPerSec,
      num_fail_per_sec: this.numFailPerSec,
      response_times: this.responseTimes,
      total_content_length: this.totalContentLength,
      start_time: this.startTime,
      last_request_timestamp: this.lastRequestTimestamp,
    };
  }
}
