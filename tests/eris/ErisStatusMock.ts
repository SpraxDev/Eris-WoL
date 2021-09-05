import { AbstractErisStatus } from '../../src/eris/AbstractErisStatus';

export class ErisStatusMock extends AbstractErisStatus {
  private pingErisResult: boolean = false;
  private sendWakeUpExitCode: number = 0;

  setPingErisResult(pingErisResult: boolean): void {
    this.pingErisResult = pingErisResult;
  }

  protected async pingEris(): Promise<boolean> {
    this.nextPing = Date.now() + AbstractErisStatus.PING_COOLDOWN;

    return this.pingErisResult;
  }

  setSendWakeUpExitCode(code: number): void {
    this.sendWakeUpExitCode = code;
  }

  protected async sendWakeUpToEris(): Promise<void> {
    this.nextWakeUp = Date.now() + AbstractErisStatus.WOL_COOLDOWN;

    if (this.sendWakeUpExitCode != 0) {
      throw new Error(`wakeonlan exited with code ${this.sendWakeUpExitCode}`);
    }
  }
}
