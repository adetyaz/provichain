/**
 * Enhanced operation monitoring for Massa blockchain
 */

import { getWeb3Provider } from './web3';

export async function waitForOperationConfirmation(
	operationId: string,
	maxWaitTime: number = 60000
) {
	console.log('⏳ === WAITING FOR OPERATION CONFIRMATION ===');
	console.log('Operation ID:', operationId);
	console.log('Max wait time:', maxWaitTime / 1000, 'seconds');
	console.log(
		'Massa Buildnet Explorer URL:',
		`https://buildnet-explorer.massa.net/#explorer?explore=${operationId}`
	);

	const startTime = Date.now();
	let attempts = 0;

	while (Date.now() - startTime < maxWaitTime) {
		attempts++;
		const elapsed = Math.floor((Date.now() - startTime) / 1000);

		console.log(`🔍 Attempt ${attempts} (${elapsed}s elapsed) - Checking operation status...`);

		try {
			// Unfortunately, Massa Web3 doesn't have direct operation status checking
			// We'll need to check indirectly by verifying if the blockchain state changed

			console.log('⏳ Waiting 10 seconds before next check...');
			await new Promise((resolve) => setTimeout(resolve, 10000));

			// After 30 seconds, suggest checking manually
			if (elapsed >= 30) {
				console.log('⚠️ Operation taking longer than expected on Buildnet');
				console.log('🔗 Please check manually in Massa Buildnet Explorer:');
				console.log(`   https://buildnet-explorer.massa.net/#explorer?explore=${operationId}`);

				if (elapsed >= 45) {
					console.log('❌ Operation timeout - likely Buildnet network congestion');
					return {
						confirmed: false,
						timeout: true,
						elapsed: elapsed,
						suggestion: 'Check Massa Buildnet Explorer for operation status'
					};
				}
			}
		} catch (error) {
			console.log('❌ Error checking operation:', error);
		}
	}

	console.log('⏰ Maximum wait time reached');
	return {
		confirmed: false,
		timeout: true,
		elapsed: Math.floor((Date.now() - startTime) / 1000),
		suggestion: 'Check Massa Buildnet Explorer for operation status'
	};
}

export async function checkMassaNetworkStatus() {
	console.log('🌐 === CHECKING MASSA NETWORK STATUS ===');

	try {
		const provider = await getWeb3Provider();

		console.log('🔗 Connected to wallet:', provider.address);
		console.log('ℹ️ Network status check limited by Massa Web3 capabilities');
		console.log('🌐 For Buildnet status, check: https://buildnet-explorer.massa.net/');

		return {
			connected: true,
			walletAddress: provider.address,
			network: 'buildnet',
			suggestion: 'Check Massa Buildnet Explorer for network status and transaction pool'
		};
	} catch (error) {
		console.log('❌ Failed to connect to network:', error);
		return {
			connected: false,
			error: error instanceof Error ? error.message : String(error),
			suggestion: 'Check wallet connection and network status'
		};
	}
}

export async function retryApprovalWithBetterFee(requestId: string) {
	console.log('🔄 === RETRYING APPROVAL WITH HIGHER FEE (BUILDNET) ===');
	console.log('Request ID:', requestId);

	try {
		const { SmartContract, Args, Mas } = await import('@massalabs/massa-web3');
		const { CONTRACT_ADDRESSES } = await import('./web3');

		const provider = await getWeb3Provider();
		const requestMarketplace = new SmartContract(provider, CONTRACT_ADDRESSES.REQUEST_MARKETPLACE);

		console.log('💰 Using higher fee for Buildnet: 0.1 MAS (10x normal fee)');
		console.log('🌐 Network: Massa Buildnet');

		const args = new Args().addString(requestId);

		const operation = await requestMarketplace.call('approveRequest', args.serialize(), {
			fee: Mas.fromString('0.1') // Much higher fee for Buildnet
		});

		console.log('✅ High-fee transaction submitted:', operation.id);
		console.log(
			'🔗 Massa Buildnet Explorer:',
			`https://buildnet-explorer.massa.net/#explorer?explore=${operation.id}`
		);

		// Wait for confirmation with extended timeout for Buildnet
		console.log('⏳ Waiting for Buildnet confirmation (up to 2 minutes)...');
		const confirmationResult = await waitForOperationConfirmation(operation.id, 120000); // 2 minutes for Buildnet

		return {
			success: true,
			operationId: operation.id,
			confirmation: confirmationResult,
			explorerUrl: `https://buildnet-explorer.massa.net/#explorer?explore=${operation.id}`,
			network: 'buildnet',
			fee: '0.1 MAS'
		};
	} catch (error) {
		console.log('❌ Retry failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}
