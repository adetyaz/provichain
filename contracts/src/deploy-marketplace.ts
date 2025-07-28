/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployMarketplaceASC() {
  const provider = await getAccountProvider();

  console.log('🚀 Deploying MarketplaceASC (Request Marketplace) contract...');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  // Get the bytecode
  const byteCode = getScByteCode('build', 'MarketplaceASC.wasm');

  // MarketplaceASC constructor requires AccessControl and ProductRegistry addresses
  const accessControlAddress =
    'AS12JiKF6YLc2eQCYdvZuybvXoHM38obVqCPRRcF1awznuafPNCBN';
  const productRegistryAddress =
    'AS12jcTBpFu1HhiAvmWyzkgHN4ZD2tuvXMTvWCo31GK16kx7TX95t';

  const constructorArgs = new Args()
    .addString(accessControlAddress)
    .addString(productRegistryAddress);

  console.log('📋 Constructor arguments:');
  console.log('  - AccessControl:', accessControlAddress);
  console.log('  - ProductRegistry:', productRegistryAddress);

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'),
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('✅ MarketplaceASC deployed at:', contract.address);
  console.log('\n🔧 UPDATE your web3.ts file with this address:');
  console.log(`REQUEST_MARKETPLACE: '${contract.address}',`);

  console.log('\n📝 Replace the placeholder in CONTRACT_ADDRESSES:');
  console.log(`// Change this line:`);
  console.log(
    `REQUEST_MARKETPLACE: 'AS12qwert1234567890ABCDEF1234567890ABCDEF1234567890'`,
  );
  console.log(`// To this:`);
  console.log(`REQUEST_MARKETPLACE: '${contract.address}'`);

  return contract.address;
}

deployMarketplaceASC().catch(console.error);
