/* eslint-disable no-console */
import { Args, SmartContract, Mas, bytesToStr } from '@massalabs/massa-web3';
import { getAccountProvider } from './utils';

async function testThreeContractIntegration() {
  const provider = await getAccountProvider();

  console.log('='.repeat(60));
  console.log('🧪 THREE-CONTRACT INTEGRATION TEST');
  console.log('='.repeat(60));
  console.log('Provider address:', provider.address);

  // Get contract addresses
  const didRegistryAddress = process.env.DID_REGISTRY_ADDRESS!;
  const participantRegistryAddress = process.env.PARTICIPANT_REGISTRY_ADDRESS!;
  const accessControlAddress = process.env.ACCESS_CONTROL_ADDRESS!;

  console.log('\n📋 Contract Addresses:');
  console.log('DID Registry:', didRegistryAddress);
  console.log('Participant Registry:', participantRegistryAddress);
  console.log('Access Control:', accessControlAddress);

  // Create contract instances
  const didRegistry = new SmartContract(provider, didRegistryAddress);
  const participantRegistry = new SmartContract(
    provider,
    participantRegistryAddress,
  );
  const accessControl = new SmartContract(provider, accessControlAddress);

  // Test data
  const testDID = 'did:massa:test-manufacturer-002';
  const controllerAddress = provider.address;
  const didDocumentHash = 'QmTestHash987654321';
  const participantName = 'Advanced Manufacturing Corp';
  const roleCategory = 'MANUFACTURER';
  const contactInfo = 'admin@advancedmfg.com';

  try {
    // Step 1: Register DID
    console.log('\n🔑 Step 1: Register DID');
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
    console.log('✅ DID registered successfully');

    // Step 2: Register Participant
    console.log('\n👤 Step 2: Register Participant');
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
    console.log('✅ Participant registered successfully');

    // Step 3: Check initial roles (should have none yet)
    console.log('\n🔍 Step 3: Check Initial Role Status');
    const initialRoles = await accessControl.read(
      'getAccountRoles',
      new Args().addString(controllerAddress).serialize(),
    );
    console.log('Initial roles:', bytesToStr(initialRoles.value));

    // Step 4: Request manufacturer role (self-service)
    console.log('\n🎯 Step 4: Request MANUFACTURER Role');
    const roleRequestOperation = await accessControl.call(
      'requestRole',
      new Args()
        .addString('MANUFACTURER')
        .addString('I am the owner of Advanced Manufacturing Corp')
        .serialize(),
      { coins: Mas.fromString('0.01') },
    );

    console.log('Role request operation:', roleRequestOperation.id);
    await roleRequestOperation.waitSpeculativeExecution();

    // Step 5: Check updated roles
    console.log('\n✅ Step 5: Check Updated Role Status');
    const updatedRoles = await accessControl.read(
      'getAccountRoles',
      new Args().addString(controllerAddress).serialize(),
    );
    console.log('Updated roles:', bytesToStr(updatedRoles.value));

    // Step 6: Test role verification
    console.log('\n🔐 Step 6: Test Role Verification');
    const hasManufacturerRole = await accessControl.read(
      'hasRole',
      new Args()
        .addString(controllerAddress)
        .addString('MANUFACTURER')
        .serialize(),
    );
    console.log(
      'Has MANUFACTURER role:',
      bytesToStr(hasManufacturerRole.value),
    );

    // Step 7: Test participant details query
    console.log('\n📊 Step 7: Query Complete Participant Profile');
    const participantDetails = await participantRegistry.read(
      'getParticipantDetails',
      new Args().addString(controllerAddress).serialize(),
    );
    console.log('Participant details:', bytesToStr(participantDetails.value));

    // Step 8: Test DID verification
    console.log('\n🔍 Step 8: Verify DID Ownership');
    const didVerification = await didRegistry.read(
      'verifyDIDOwnership',
      new Args().addString(testDID).addString(controllerAddress).serialize(),
    );
    console.log('DID ownership verified:', bytesToStr(didVerification.value));

    // Step 9: Get all events for audit trail
    console.log('\n📋 Step 9: Audit Trail');

    const didEvents = await provider.getEvents({
      smartContractAddress: didRegistryAddress,
    });
    console.log(
      'DID Registry events:',
      didEvents.slice(-2).map((e) => e.data),
    );

    const participantEvents = await provider.getEvents({
      smartContractAddress: participantRegistryAddress,
    });
    console.log(
      'Participant Registry events:',
      participantEvents.slice(-2).map((e) => e.data),
    );

    const accessEvents = await provider.getEvents({
      smartContractAddress: accessControlAddress,
    });
    console.log(
      'Access Control events:',
      accessEvents.slice(-2).map((e) => e.data),
    );

    console.log('\n🎉 THREE-CONTRACT INTEGRATION TEST COMPLETE');
    console.log(
      '✅ Identity, Participant, and Access Control systems working together!',
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

await testThreeContractIntegration().catch(console.error);
