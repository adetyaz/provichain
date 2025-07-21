/* eslint-disable no-console */
import { Args, SmartContract, Mas, bytesToStr } from '@massalabs/massa-web3';
import { getAccountProvider } from './utils';

async function testContractInteraction() {
  const provider = await getAccountProvider();

  console.log('Testing contract interaction...');
  console.log('Provider address:', provider.address);

  // Get contract addresses
  const didRegistryAddress = process.env.DID_REGISTRY_ADDRESS!;
  const participantRegistryAddress = process.env.PARTICIPANT_REGISTRY_ADDRESS!;

  console.log('DID Registry:', didRegistryAddress);
  console.log('Participant Registry:', participantRegistryAddress);

  // Create contract instances
  const didRegistry = new SmartContract(provider, didRegistryAddress);
  const participantRegistry = new SmartContract(
    provider,
    participantRegistryAddress,
  );

  // Test 1: Register a DID
  console.log('\n=== Test 1: Register DID ===');
  const testDID = 'did:massa:test-manufacturer-001';
  const controllerAddress = provider.address;
  const didDocumentHash = 'QmTestHash123456789';

  try {
    const didOperation = await didRegistry.call(
      'registerDID',
      new Args()
        .addString(testDID)
        .addString(controllerAddress)
        .addString(didDocumentHash)
        .serialize(),
      { coins: Mas.fromString('0.01') },
    );

    console.log('DID registration operation:', didOperation.id);
    await didOperation.waitSpeculativeExecution();

    const didEvents = await provider.getEvents({
      smartContractAddress: didRegistryAddress,
    });
    console.log(
      'DID events:',
      didEvents.slice(-1).map((e) => e.data),
    );
  } catch (error) {
    console.error('DID registration failed:', error);
  }

  // Test 2: Register participant using the DID
  console.log('\n=== Test 2: Register Participant ===');
  const participantName = 'Test Manufacturer Inc.';
  const roleCategory = 'MANUFACTURER';
  const contactInfo = 'contact@testmanufacturer.com';

  try {
    const participantOperation = await participantRegistry.call(
      'registerParticipant',
      new Args()
        .addString(controllerAddress)
        .addString(testDID)
        .addString(participantName)
        .addString(roleCategory)
        .addString(contactInfo)
        .serialize(),
      { coins: Mas.fromString('0.01') },
    );

    console.log('Participant registration operation:', participantOperation.id);
    await participantOperation.waitSpeculativeExecution();

    const participantEvents = await provider.getEvents({
      smartContractAddress: participantRegistryAddress,
    });
    console.log(
      'Participant events:',
      participantEvents.slice(-1).map((e) => e.data),
    );
  } catch (error) {
    console.error('Participant registration failed:', error);
  }

  // Test 3: Query participant details
  console.log('\n=== Test 3: Query Participant Details ===');
  try {
    const result = await participantRegistry.read(
      'getParticipantDetails',
      new Args().addString(controllerAddress).serialize(),
    );

    console.log('Participant details result:', bytesToStr(result.value));
  } catch (error) {
    console.error('Query failed:', error);
  }

  // Test 4: Verify DID ownership
  console.log('\n=== Test 4: Verify DID Ownership ===');
  try {
    const verifyResult = await didRegistry.read(
      'verifyDIDOwnership',
      new Args().addString(testDID).addString(controllerAddress).serialize(),
    );

    console.log('DID ownership verification:', bytesToStr(verifyResult.value));
  } catch (error) {
    console.error('DID verification failed:', error);
  }

  console.log('\n=== Contract Interaction Test Complete ===');
}

await testContractInteraction().catch(console.error);
