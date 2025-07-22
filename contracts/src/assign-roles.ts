/* eslint-disable no-console */
import { Args, SmartContract, Mas, bytesToStr } from '@massalabs/massa-web3';
import { getAccountProvider } from './utils';

/**
 * Complete Role Assignment and Product Testing System
 * Tests the full user journey: Role assignment → Product minting → Frontend readiness
 * Uses only the working contracts without DID dependency
 */

async function testCompleteUserFlow() {
  console.log('🌟 COMPLETE USER FLOW TESTING');
  console.log('='.repeat(50));

  // Test different user roles
  const roles = ['MANUFACTURER', 'CONSUMER', 'LOGISTICS'];

  for (const role of roles) {
    console.log(`\n🎭 Testing ${role} role assignment...`);
    const result = await assignUserRole(
      role,
      `Complete system test - assigning ${role} role for frontend integration`,
    );

    if (result.success) {
      console.log(`✅ ${role} role assignment successful!`);
    } else {
      console.log(`❌ ${role} role assignment failed:`, result.message);
    }
  }

  // Test product functionality
  await testProductFunctionality();
}

async function testProductFunctionality() {
  const provider = await getAccountProvider();
  const productRegistry = new SmartContract(
    provider,
    process.env.PRODUCT_REGISTRY_ADDRESS!,
  );

  console.log('\n📦 Testing Product Registry Functionality...');

  try {
    // Test product minting
    const testProduct = {
      id: 'PROV-TEST-' + Date.now(),
      name: 'Test Supply Chain Product',
      batch: 'BATCH-001',
      metadata: 'QmTestHash123456789',
    };

    console.log('⚡ Minting test product...');
    const mintOperation = await productRegistry.call(
      'mintProduct',
      new Args()
        .addString(testProduct.id)
        .addString(testProduct.name)
        .addString(testProduct.batch)
        .addString(testProduct.metadata)
        .serialize(),
      {
        coins: Mas.fromString('0.01'),
      },
    );

    console.log('Product mint operation:', mintOperation.id);
    await mintOperation.waitSpeculativeExecution();

    // Verify the product was created
    const productData = await productRegistry.read(
      'getProduct',
      new Args().addString(testProduct.id).serialize(),
    );

    console.log('✅ Product created successfully!');
    console.log('Product data:', bytesToStr(productData.value));

    return { success: true, productId: testProduct.id };
  } catch (error) {
    console.log(
      '❌ Product testing failed:',
      error instanceof Error ? error.message : String(error),
    );
    return { success: false, error };
  }
}

async function assignUserRole(roleName: string, justification: string) {
  const provider = await getAccountProvider();

  console.log('🎭 USER ROLE ASSIGNMENT');
  console.log('='.repeat(40));
  console.log('User address:', provider.address);
  console.log('Requested role:', roleName);
  console.log('Justification:', justification);

  const accessControl = new SmartContract(
    provider,
    process.env.ACCESS_CONTROL_ADDRESS!,
  );

  try {
    // Step 1: Check current roles
    console.log('\n🔍 Step 1: Current Role Status');
    const currentRoles = await accessControl.read(
      'getAccountRoles',
      new Args().addString(provider.address).serialize(),
    );
    console.log('Current roles:', bytesToStr(currentRoles.value));

    // Step 2: Check if already has the role
    const hasRole = await accessControl.read(
      'hasRole',
      new Args().addString(provider.address).addString(roleName).serialize(),
    );

    if (bytesToStr(hasRole.value).includes('true')) {
      console.log(`✅ Already has ${roleName} role!`);
      return { success: true, message: `Already has ${roleName} role` };
    }

    // Step 3: Request the role
    console.log(`\n🎯 Step 2: Requesting ${roleName} Role`);

    const roleOperation = await accessControl.call(
      'requestRole',
      new Args().addString(roleName).addString(justification).serialize(),
      {
        coins: Mas.fromString('0.01'), // Minimal cost
      },
    );

    console.log('Role request submitted:', roleOperation.id);
    await roleOperation.waitSpeculativeExecution();
    console.log('✅ Role request completed');

    // Step 4: Verify role assignment
    console.log('\n✅ Step 3: Verify Role Assignment');
    const updatedRoles = await accessControl.read(
      'getAccountRoles',
      new Args().addString(provider.address).serialize(),
    );
    console.log('Updated roles:', bytesToStr(updatedRoles.value));

    const finalCheck = await accessControl.read(
      'hasRole',
      new Args().addString(provider.address).addString(roleName).serialize(),
    );

    if (bytesToStr(finalCheck.value).includes('true')) {
      console.log(`\n🎉 SUCCESS! ${roleName} role assigned successfully!`);
      return {
        success: true,
        role: roleName,
        address: provider.address,
        allRoles: bytesToStr(updatedRoles.value),
      };
    } else {
      console.log(`\n⚠️ Role request submitted but may need approval`);
      return {
        success: false,
        message: 'Role requested but pending approval',
        allRoles: bytesToStr(updatedRoles.value),
      };
    }
  } catch (error) {
    console.error('❌ Role assignment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Available roles in the system
const availableRoles = [
  'MANUFACTURER',
  'LOGISTICS_PROVIDER',
  'RETAILER',
  'AUDITOR',
  'CONSUMER',
];

async function createManufacturer() {
  console.log('🏭 Creating Manufacturer Profile...');

  return await assignUserRole(
    'MANUFACTURER',
    'I am registering as a manufacturer to create and track products in the supply chain',
  );
}

async function createLogisticsProvider() {
  console.log('🚚 Creating Logistics Provider Profile...');

  return await assignUserRole(
    'LOGISTICS_PROVIDER',
    'I am registering as a logistics provider to handle product shipments and tracking',
  );
}

async function createRetailer() {
  console.log('🏪 Creating Retailer Profile...');

  return await assignUserRole(
    'RETAILER',
    'I am registering as a retailer to sell products to consumers',
  );
}

async function createConsumer() {
  console.log('👤 Creating Consumer Profile...');

  return await assignUserRole(
    'CONSUMER',
    'I am registering as a consumer to verify product authenticity',
  );
}

// Export functions for use
export {
  assignUserRole,
  createManufacturer,
  createLogisticsProvider,
  createRetailer,
  createConsumer,
  availableRoles,
};

// Main execution - create a manufacturer by default
if (import.meta.url === `file://${process.argv[1]}`) {
  await createManufacturer().catch(console.error);
}
