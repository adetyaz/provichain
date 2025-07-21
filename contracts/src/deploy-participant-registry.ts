/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployParticipantRegistry() {
  const provider = await getAccountProvider();

  console.log('Deploying ParticipantRegistryASC contract...');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  // Get DID Registry address from environment
  const didRegistryAddress = process.env.DID_REGISTRY_ADDRESS;
  if (!didRegistryAddress) {
    throw new Error('DID_REGISTRY_ADDRESS not found in .env file');
  }

  console.log('Using DID Registry at:', didRegistryAddress);

  const byteCode = getScByteCode('build', 'ParticipantRegistryASC.wasm');

  // Constructor args: DID Registry address
  const constructorArgs = new Args().addString(didRegistryAddress);

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'),
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('ParticipantRegistryASC deployed at:', contract.address);
  console.log(
    `Add this to your .env file:\nPARTICIPANT_REGISTRY_ADDRESS="${contract.address}"\n`,
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

await deployParticipantRegistry().catch(console.error);
