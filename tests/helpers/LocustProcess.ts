import { spawn, ChildProcess } from 'child_process';

import got from 'got';

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
  cmd?: ChildProcess;
  stdout: string;
  stderr: string;
  web_uri: string;
  zeromq_uri: string;

  constructor() {
    this.stdout = '';
    this.stderr = '';
    this.web_uri = 'http://127.0.0.1:18089';
    this.zeromq_uri = 'tcp://127.0.0.1:15557';
  }

  /**
   * Start Locust as a child process and return a Promise which resolves when
   * Locust prints 'Starting Locust' to stderr.
   */
  start(): Promise<void> {
    this.cmd = spawn(
      'locust',
      [
        '--locustfile', `${__dirname}/locustfile.py`,
        '--master',
        '--master-bind-host=127.0.0.1',
        '--master-bind-port=15557',
        '--web-host=127.0.0.1',
        '--web-port=18089',
      ],
    );

    return new Promise((resolve, reject) => {
      this.cmd!.stdout!.on('data', (data) => {
        this.stdout += data;
      });
      this.cmd!.stderr!.on('data', (data) => {
        this.stderr += data;

        if(data.includes('Starting Locust')) {
          resolve();
        }
      });
      this.cmd!.on('error', (err) => {
        reject(new Error(`Locust failed to start; error=${err} stdout=${this.stdout} stderr=${this.stderr}`));
      });
      this.cmd!.on('close', (code) => {
        reject(new Error(`Locust failed to start; code=${code} stdout=${this.stdout} stderr=${this.stderr}`));
      });
    });
  }

  /**
   * Send a SIGTERM signal to the Locust process and return a Promise which
   * resolves when the process exits.
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if(!this.cmd) {
        resolve();
        return;
      }
      this.cmd.on('close', (code) => {
        if(code == 0) {
          resolve();
        } else {
          reject(new Error(`Locust exited with non-zero exit status: ${code}`));
        }
      });

      this.cmd.kill();
    });
  }

  /**
   * Retrieve stats from the Locust web API.
   */
  stats(): Promise<StatsResponse> {
    return got.get(`${this.web_uri}/stats/requests`).json();
  }

  /**
   * Start a load test using the Locust web API.
   */
  startLoadTest(req: SpawnRequest): Promise<SpawnResponse> {
    return got.post(`${this.web_uri}/swarm`, { form: req }).json();
  }

  /**
   * Stop a load test using the Locust web API.
   */
  stopLoadTest(): Promise<SpawnResponse> {
    return got.get(`${this.web_uri}/stop`).json();
  }
}
