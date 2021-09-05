export abstract class AbstractErisStatus {
  public static readonly PING_COOLDOWN = 500;
  public static readonly WOL_COOLDOWN = 2_500;

  protected nextWakeUp?: number;
  protected nextPing?: number;

  protected online: boolean = false;
  protected lastOnlinePing: number = -1;

  protected abstract pingEris(): Promise<boolean>;

  protected abstract sendWakeUpToEris(): Promise<void>;

  /**
   * @returns true, if Eris is responding to pings
   */
  async isOnline(): Promise<boolean> {
    if (this.nextPing == null || this.getPingCooldown() == 0) {
      this.online = await this.pingEris();

      if (this.online) {
        this.lastOnlinePing = Date.now();
      }
    }

    return this.online;
  }

  /**
   * @returns false, if `#getWakeUpCooldown() > 0`, true otherwise
   */
  async wakeUp(): Promise<boolean> {
    if ((await this.isOnline()) ||
        (this.nextWakeUp != null && this.getWakeUpCooldown() != 0)) {
      return false;
    }

    await this.sendWakeUpToEris();
    return true;
  }

  /**
   * @returns unix timestamp in milliseconds or `-1` if never seen as online
   *
   * @see Date
   */
  getLastOnlinePing(): number {
    return this.lastOnlinePing;
  }

  /**
   * @returns The current cooldown for Wake-On-Lan in milliseconds
   */
  getWakeUpCooldown(): number {
    return AbstractErisStatus.getCooldown(this.nextWakeUp);
  }

  /**
   * @returns The current cooldown for pings in milliseconds
   */
  getPingCooldown(): number {
    return AbstractErisStatus.getCooldown(this.nextPing);
  }

  protected static getCooldown(millisWhenNextTime?: number): number {
    const now = Date.now();

    if (millisWhenNextTime == null || now > millisWhenNextTime) {
      return 0;
    }

    return millisWhenNextTime - now;
  }
}
