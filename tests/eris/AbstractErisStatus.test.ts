import { AbstractErisStatus } from '../../src/eris/AbstractErisStatus';
import { ErisStatusMock } from './ErisStatusMock';

let erisStatus: ErisStatusMock;

beforeEach(() => {
  erisStatus = new ErisStatusMock();
});

test('isOnline and its ping calls', async (): Promise<void> => {
  erisStatus.setPingErisResult(false);
  expect(await erisStatus.isOnline())
      .toBe(false);

  erisStatus.setPingErisResult(true);
  expect(await erisStatus.isOnline())
      .toBe(false);

  await sleep(AbstractErisStatus.PING_COOLDOWN + 100);

  expect(await erisStatus.isOnline())
      .toBe(true);

  expect(Date.now() - erisStatus.getLastOnlinePing())
      .toBeLessThanOrEqual(10);
});

test('calling wakeUp', async () => {
  erisStatus.setSendWakeUpExitCode(0);
  expect(await erisStatus.wakeUp())
      .toBeTruthy();

  expect(await erisStatus.wakeUp())
      .toBeFalsy();

  erisStatus.setSendWakeUpExitCode(1);

  await sleep(AbstractErisStatus.WOL_COOLDOWN + 100);

  await expect(erisStatus.wakeUp())
      .rejects
      .toThrowError();
});

async function sleep(millis: number): Promise<void> {
  console.log(`Sleeping for ${millis} ms`);

  return new Promise(resolve => setTimeout(() => resolve(), millis));
}
