/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployDIDRegistry() {
  const provider = await getAccountProvider();

  console.log('Deploying DIDRegistryASC contract...');
  console.log('Provider address:', provider.address);
  
  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  // Note: Ensure you have sufficient MAS for deployment

  const byteCode = getScByteCode('build', 'DIDRegistryASC.wasm');

  // No constructor arguments needed for DIDRegistry
  const constructorArgs = new Args();

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'), // Small amount for deployment
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('DIDRegistryASC deployed at:', contract.address);
  console.log(
    `Add this to your .env file:\nDID_REGISTRY_ADDRESS="${contract.address}"\n`,
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

await deployDIDRegistry().catch(console.error);
