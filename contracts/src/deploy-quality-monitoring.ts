/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployQualityMonitoring() {
  const provider = await getAccountProvider();

  console.log('Deploying QualityMonitoringASC contract...');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  const byteCode = getScByteCode('build', 'QualityMonitoringASC.wasm');

  // No constructor arguments needed
  const constructorArgs = new Args();

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'),
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('QualityMonitoringASC deployed at:', contract.address);
  console.log(
    `Add this to your .env file:\nQUALITY_MONITORING_ADDRESS="${contract.address}"\n`,
  );

  // Get deployment events
  const events = await provider.getEvents({
    smartContractAddress: contract.address,
  });

  for (const event of events) {
    console.log('Deployment event:', event.data);
  }

  return contract.address;
}

await deployQualityMonitoring().catch(console.error);
