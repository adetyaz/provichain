/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployEssentialContracts() {
  const provider = await getAccountProvider();

  console.log('==========================================');
  console.log('🚀 Deploying Essential ProviChain Contracts');
  console.log('==========================================');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  const balanceInMas = Number(balance) / 1000000000; // Convert from nanoMAS to MAS
  if (balanceInMas < 0.3) {
    console.error(
      '⚠️ Insufficient balance for deployment. Need at least 0.3 MAS',
    );
    return;
  }

  const deployedContracts: { [key: string]: string } = {};

  try {
    // Deploy QualityMonitoringASC (for manual IoT simulation)
    console.log('\n📊 Deploying QualityMonitoringASC...');
    const qualityByteCode = getScByteCode('build', 'QualityMonitoringASC.wasm');
    const qualityContract = await provider.deploySC({
      coins: Mas.fromString('0.1'),
      byteCode: qualityByteCode,
      parameter: new Args().serialize(),
    });
    deployedContracts.QualityMonitoring = qualityContract.address;
    console.log(
      '✅ QualityMonitoringASC deployed at:',
      qualityContract.address,
    );

    // Deploy LogisticsTrackingASC (for shipment tracking)
    console.log('\n🚚 Deploying LogisticsTrackingASC...');
    const logisticsByteCode = getScByteCode(
      'build',
      'LogisticsTrackingASC.wasm',
    );
    const logisticsContract = await provider.deploySC({
      coins: Mas.fromString('0.1'),
      byteCode: logisticsByteCode,
      parameter: new Args().serialize(),
    });
    deployedContracts.LogisticsTracking = logisticsContract.address;
    console.log(
      '✅ LogisticsTrackingASC deployed at:',
      logisticsContract.address,
    );

    // Summary
    console.log('\n==========================================');
    console.log('🎉 Deployment Summary');
    console.log('==========================================');
    console.log('Essential contracts deployed successfully!\n');

    console.log('📝 Add these to your .env file:');
    console.log(
      `QUALITY_MONITORING_ADDRESS="${deployedContracts.QualityMonitoring}"`,
    );
    console.log(
      `LOGISTICS_TRACKING_ADDRESS="${deployedContracts.LogisticsTracking}"`,
    );

    console.log('\n📝 Add these to your web3.ts CONTRACT_ADDRESSES:');
    console.log(
      `QUALITY_MONITORING: '${deployedContracts.QualityMonitoring}',`,
    );
    console.log(
      `LOGISTICS_TRACKING: '${deployedContracts.LogisticsTracking}',`,
    );

    console.log(
      '\n💡 Note: Marketplace will be frontend-only (no smart contract needed)',
    );

    return deployedContracts;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

await deployEssentialContracts().catch(console.error);
