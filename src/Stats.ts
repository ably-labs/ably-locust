import { StatsEntry } from './StatsEntry';
import { StatsError } from './StatsError';

/**
 * Locust stats which are periodically sent to the Locust master and displayed
 * in the web UI.
 */
export class Stats {
  /**
   * A list of named stats which appear as individual rows on the Locust
   * Statistics page.
   */
  entries: { [key: string]: StatsEntry };

  /**
   * Aggregated stats across all named stats which appear in the 'Aggregated'
   * row on the Locust Statistics page.
   */
  total: StatsEntry;

  /**
   * A list of named errors which appear on the Locust Failures page.
   */
  errors: { [key: string]: StatsError };

  constructor() {
    this.entries = {};
    this.total = new StatsEntry('Aggregated');
    this.errors = {};
  }

  /**
   * Log a request against the stats with the given name.
   */
  logRequest(name: string, responseTime?: number, contentLength?: number) {
    this.total.log(responseTime, contentLength);
    this.get(name).log(responseTime, contentLength);
  }

  /**
   * Log an error with the given name.
   */
  logError(name: string, error: string) {
    this.total.logError();
    this.get(name).logError();

    let entry = this.errors[`${name}.${error}`];
    if (!entry) {
      entry = new StatsError(name, error);
      this.errors[`${name}.${error}`] = entry;
    }
    entry.occurrences += 1;
  }

  /**
   * Get the stats entry with the give name, initialising it if it doesn't
   * exist.
   */
  get(name: string) {
    let entry = this.entries[name];
    if (!entry) {
      entry = new StatsEntry(name);
      this.entries[name] = entry;
    }
    return entry;
  }

  /**
   * Collect the current stats and reset them to zero.
   */
  collect() {
    return {
      stats: Object.entries(this.entries).map(([_, entry]) => entry.collect()),
      stats_total: this.total.collect(),
      errors: Object.fromEntries(Object.entries(this.errors).map(([key, entry]) => [key, entry.encode()])),
    };
  }
}
