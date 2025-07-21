/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployAccessControl() {
  const provider = await getAccountProvider();

  console.log('Deploying AccessControlASC contract...');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  // Get required contract addresses
  const participantRegistryAddress = process.env.PARTICIPANT_REGISTRY_ADDRESS;
  if (!participantRegistryAddress) {
    throw new Error('PARTICIPANT_REGISTRY_ADDRESS not found in .env file');
  }

  console.log('Using Participant Registry at:', participantRegistryAddress);
  console.log('Initial Super Admin:', provider.address);

  const byteCode = getScByteCode('build', 'AccessControlASC.wasm');

  // Constructor args: initialAdmin, participantRegistryAddress
  const constructorArgs = new Args()
    .addString(provider.address) // Deployer becomes initial SUPER_ADMIN
    .addString(participantRegistryAddress);

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'),
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('AccessControlASC deployed at:', contract.address);
  console.log(
    `Add this to your .env file:\nACCESS_CONTROL_ADDRESS="${contract.address}"\n`,
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

await deployAccessControl().catch(console.error);
