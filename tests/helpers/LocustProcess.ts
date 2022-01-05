import got from 'got';

const web_uri = 'http://127.0.0.1:8089';

/**
 * A Locust API response from GET /stats/requests.
 */
interface StatsResponse {
  workers: string[];
}

/**
 * A Locust API request to POST /spawn.
 */
interface SpawnRequest {
  user_count: number;
  spawn_rate: number;
}

/**
 * A Locust API response from POST /spawn.
 */
interface SpawnResponse {
  success: boolean;
  message: string;
}

/**
 * A helper for running Locust as a child process.
 *
 * Expects 'locust' to be in $PATH.
 */
export class LocustProcess {
  /**
   * Retrieve stats from the Locust web API.
   */
  stats(): Promise<StatsResponse> {
    return got.get(`${web_uri}/stats/requests`).json();
  }

  /**
   * Start a load test using the Locust web API.
   */
  startLoadTest(req: SpawnRequest): Promise<SpawnResponse> {
    return got.post(`${web_uri}/swarm`, { form: req }).json();
  }

  /**
   * Stop a load test using the Locust web API.
   */
  stopLoadTest(): Promise<SpawnResponse> {
    return got.get(`${web_uri}/stop`).json();
  }
}
