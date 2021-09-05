import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { IConfig } from '../global';
import { AbstractErisStatus } from './AbstractErisStatus';

export class ErisStatus extends AbstractErisStatus {
  private readonly host: string;
  private readonly macAddress: string;

  constructor(eris: IConfig['eris']) {
    super();

    this.host = eris.host;
    this.macAddress = eris.macAddress;
  }

  protected async pingEris(): Promise<boolean> {
    this.nextPing = Date.now() + AbstractErisStatus.PING_COOLDOWN;

    return new Promise((resolve) => {
      const process = spawn('fping',
          ['--count=1', '--period=100', '--reachable=1', this.host],
          {cwd: tmpdir()}
      );

      process.on('close', (code) => {
        resolve(code == 0);
      });
    });
  }

  protected async sendWakeUpToEris(): Promise<void> {
    this.nextWakeUp = Date.now() + AbstractErisStatus.WOL_COOLDOWN;

    return new Promise((resolve, reject) => {
      const process = spawn('wakeonlan', [this.macAddress], {cwd: tmpdir()});

      let errBuffer = '';

      process.stderr.on('data', (chunk) => {
        errBuffer += chunk.toString();
      });

      process.on('close', (code) => {
        if (code != 0 || errBuffer.indexOf('is not a hardware address and I could not resolve it as to an IP address.') != -1) {
          return reject(new Error(`wakeonlan encountered an error (exit=${code},err='${errBuffer}')`));
        }

        return resolve();
      });
    });
  }
}
