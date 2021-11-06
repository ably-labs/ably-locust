/**
 * A named error which appears as a single row in the Failures tab of the
 * Locust web UI.
 */
export class StatsError {
  name: string;
  error: string;
  occurrences: number;

  constructor(name: string, error: string) {
    this.name = name;
    this.error = error;
    this.occurrences = 0;
  }

  encode() {
    return {
      name: this.name,
      method: 'ably-locust',
      error: this.error,
      occurrences: this.occurrences,
    };
  }
}
