import { getScByteCode, getAccountProvider } from './utils';
import { Args, Mas } from '@massalabs/massa-web3';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

async function deployAllASCContracts() {
  console.log('🚀 Starting deployment of all ASC contracts...\n');

  try {
    // Initialize the provider
    const provider = await getAccountProvider();
    console.log('Provider address:', provider.address);

    const balance = await provider.balance();
    console.log('Provider balance:', balance.toString());

    // Get all contract addresses we'll need for constructors
    const accessControlAddress = process.env.PUBLIC_ACCESS_CONTROL_ADDRESS;
    const productRegistryAddress = process.env.PUBLIC_PRODUCT_REGISTRY_ADDRESS;
    const participantRegistryAddress =
      process.env.PUBLIC_PARTICIPANT_REGISTRY_ADDRESS;
    const didRegistryAddress = process.env.PUBLIC_DID_REGISTRY_ADDRESS;

    console.log('📋 Using existing contract addresses:');
    console.log('- AccessControl:', accessControlAddress);
    console.log('- ProductRegistry:', productRegistryAddress);
    console.log('- ParticipantRegistry:', participantRegistryAddress);
    console.log('- DIDRegistry:', didRegistryAddress);
    console.log('');

    // 1. Deploy QualityMonitoringASC
    console.log('1️⃣ Deploying QualityMonitoringASC...');
    const qualityByteCode = getScByteCode('build', 'QualityMonitoringASC.wasm');
    const qualityArgs = new Args()
      .addString(accessControlAddress!)
      .addString(productRegistryAddress!);

    const qualityDeployment = await provider.deploySC({
      coins: Mas.fromString('0.1'),
      byteCode: qualityByteCode,
      parameter: qualityArgs.serialize(),
    });

    const qualityAddress = qualityDeployment.address;
    console.log('✅ QualityMonitoringASC deployed at:', qualityAddress);

    // 2. Deploy LogisticsTrackingASC
    console.log('\n2️⃣ Deploying LogisticsTrackingASC...');
    const logisticsByteCode = getScByteCode(
      'build',
      'LogisticsTrackingASC.wasm',
    );
    const logisticsArgs = new Args()
      .addString(accessControlAddress!)
      .addString(productRegistryAddress!);

    const logisticsDeployment = await provider.deploySC({
      coins: Mas.fromString('0.1'),
      byteCode: logisticsByteCode,
      parameter: logisticsArgs.serialize(),
    });

    const logisticsAddress = logisticsDeployment.address;
    console.log('✅ LogisticsTrackingASC deployed at:', logisticsAddress);

    // 3. Deploy MarketplaceASC
    console.log('\n3️⃣ Deploying MarketplaceASC...');
    const marketplaceByteCode = getScByteCode('build', 'MarketplaceASC.wasm');
    const marketplaceArgs = new Args()
      .addString(accessControlAddress!)
      .addString(productRegistryAddress!);

    const marketplaceDeployment = await provider.deploySC({
      coins: Mas.fromString('0.1'),
      byteCode: marketplaceByteCode,
      parameter: marketplaceArgs.serialize(),
    });

    const marketplaceAddress = marketplaceDeployment.address;
    console.log('✅ MarketplaceASC deployed at:', marketplaceAddress);

    // Summary and environment update instructions
    console.log('\n🎉 All ASC contracts deployed successfully!\n');
    console.log('📝 Add these addresses to your .env file:');
    console.log(`PUBLIC_QUALITY_MONITORING_ADDRESS=${qualityAddress}`);
    console.log(`PUBLIC_LOGISTICS_TRACKING_ADDRESS=${logisticsAddress}`);
    console.log(`PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
    console.log('');
    console.log(
      '🔧 Also update src/lib/config/environment.ts to include these contracts',
    );

    return {
      qualityMonitoring: qualityAddress,
      logisticsTracking: logisticsAddress,
      marketplace: marketplaceAddress,
    };
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment if this file is executed directly
deployAllASCContracts().catch(console.error);

export { deployAllASCContracts };
