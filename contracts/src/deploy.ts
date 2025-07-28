/* eslint-disable no-console */
import { Args, Mas } from '@massalabs/massa-web3';
import { getScByteCode, getAccountProvider } from './utils';

async function deployProductRegistry() {
  const provider = await getAccountProvider();

  console.log('🚀 Deploying ProductRegistryASC contract...');
  console.log('Provider address:', provider.address);

  const balance = await provider.balance();
  console.log('Provider balance:', balance.toString());

  // Get the bytecode
  const byteCode = getScByteCode('build', 'ProductRegistryASC.wasm');

  // ProductRegistry constructor requires AccessControl address
  const accessControlAddress =
    'AS12JiKF6YLc2eQCYdvZuybvXoHM38obVqCPRRcF1awznuafPNCBN';
  const constructorArgs = new Args().addString(accessControlAddress);

  const contract = await provider.deploySC({
    coins: Mas.fromString('0.1'),
    byteCode,
    parameter: constructorArgs.serialize(),
  });

  console.log('✅ ProductRegistryASC deployed at:', contract.address);
  console.log('\n🔧 UPDATE your web3.ts file with this address:');
  console.log(`PRODUCT_REGISTRY: '${contract.address}',`);

  return contract.address;
}

deployProductRegistry().catch(console.error);
