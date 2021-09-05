import { networkInterfaces } from 'os';
import { ErisStatus } from '../../src/eris/ErisStatus';


test('Is the current machine online?', async (): Promise<void> => {
  const netData = getLocalNetworkData();
  const erisStatus = new ErisStatus({host: netData.ip, macAddress: netData.mac});
  console.log('Using:', netData);

  expect(await erisStatus.isOnline())
      .toBe(true);

  expect(Date.now() - erisStatus.getLastOnlinePing())
      .toBeLessThanOrEqual(10);
});

test('Sending WoL to the current machine', async () => {
  const netData = getLocalNetworkData();
  let erisStatus = new ErisStatus({host: 'invalid-ip', macAddress: netData.mac});
  console.log('Using:', {ip: 'invalid-ip', mac: netData.mac});

  expect(await erisStatus.wakeUp())
      .toBeTruthy();

  expect(await erisStatus.wakeUp())
      .toBeFalsy();

  erisStatus = new ErisStatus({host: netData.ip, macAddress: netData.mac});
  console.log('Using:', netData);

  expect(await erisStatus.wakeUp())
      .toBeFalsy();

  erisStatus = new ErisStatus({host: 'invalid-ip', macAddress: 'invalid-mac'});
  console.log('Using:', {ip: 'invalid-ip', mac: 'invalid-mac'});

  await expect(erisStatus.wakeUp())
      .rejects
      .toThrowError();
});

function getLocalNetworkData(): { ip: string, mac: string } {
  const netInterfaces = networkInterfaces();

  for (const key in netInterfaces) {
    const adapters = netInterfaces[key];

    if (adapters) {
      for (const netInterface of adapters) {
        if (netInterface.mac != '00:00:00:00:00:00') {
          return {ip: netInterface.address, mac: netInterface.mac};
        }
      }
    }
  }

  return {ip: '127.0.0.1', mac: '00:00:00:00:00:00'};
}
