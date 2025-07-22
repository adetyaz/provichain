/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployProductRegistry() {
  const provider = await getAccountProvider();

  console.log('🔄 DEPLOYING ProductRegistryASC contract...');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  // Get required contract addresses
  const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS;
  if (!accessControlAddress) {
    throw new Error('ACCESS_CONTROL_ADDRESS not found in .env file');
  }

  console.log('Using Access Control at:', accessControlAddress);

  const byteCode = getScByteCode('build', 'ProductRegistryASC.wasm');

  // Constructor args: accessControlAddress
  const constructorArgs = new Args().addString(accessControlAddress);

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'),
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('ProductRegistryASC deployed at:', contract.address);
  console.log(
    `Add this to your .env file:\nPRODUCT_REGISTRY_ADDRESS="${contract.address}"\n`,
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

await deployProductRegistry().catch(console.error);
