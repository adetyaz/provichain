import { SmartContract, Args } from '@massalabs/massa-web3';
import { CONFIG } from '../config/environment';
import { getAccountProvider } from '../web3';

export interface QualityThresholds {
	temperatureMin: number;
	temperatureMax: number;
	humidityMin: number;
	humidityMax: number;
}

export interface ASCConfiguration {
	enableQualityMonitoring: boolean;
	temperatureThreshold?: number;
	humidityThreshold?: number;
	thresholds?: QualityThresholds;
}

export interface QualityAlert {
	timestamp: number;
	alertType: string;
	value: number;
	threshold: number;
	message: string;
}

export class ASCService {
	private qualityMonitoringContract: SmartContract | null = null;
	private logisticsTrackingContract: SmartContract | null = null;
	private marketplaceContract: SmartContract | null = null;

	/**
	 * Initialize contracts with the current provider
	 */
	private async initializeContracts() {
		try {
			const provider = await getAccountProvider();

			if (CONFIG.contracts.qualityMonitoring) {
				this.qualityMonitoringContract = new SmartContract(
					provider,
					CONFIG.contracts.qualityMonitoring
				);
			}

			if (CONFIG.contracts.logisticsTracking) {
				this.logisticsTrackingContract = new SmartContract(
					provider,
					CONFIG.contracts.logisticsTracking
				);
			}

			if (CONFIG.contracts.marketplace) {
				this.marketplaceContract = new SmartContract(provider, CONFIG.contracts.marketplace);
			}
		} catch (error) {
			console.error('Failed to initialize ASC contracts:', error);
		}
	}

	/**
	 * Set quality monitoring thresholds for a product in the QualityMonitoringASC contract
	 */
	async setQualityThresholds(
		productId: string,
		thresholds: QualityThresholds
	): Promise<string | null> {
		await this.initializeContracts();

		if (!this.qualityMonitoringContract) {
			console.error('QualityMonitoringASC contract not initialized');
			return null;
		}

		try {
			const args = new Args()
				.addString(productId)
				.addF64(thresholds.temperatureMin)
				.addF64(thresholds.temperatureMax)
				.addF64(thresholds.humidityMin)
				.addF64(thresholds.humidityMax);

			const operation = await this.qualityMonitoringContract.call(
				'setQualityThresholds',
				args.serialize()
			);

			console.log('Quality thresholds set, operation ID:', operation.id);
			return operation.id;
		} catch (error) {
			console.error('Failed to set quality thresholds:', error);
			return null;
		}
	}

	/**
	 * Get quality thresholds for a product from the QualityMonitoringASC contract
	 */
	async getQualityThresholds(productId: string): Promise<QualityThresholds | null> {
		await this.initializeContracts();

		if (!this.qualityMonitoringContract) {
			console.error('QualityMonitoringASC contract not initialized');
			return null;
		}

		try {
			const args = new Args().addString(productId);

			const result = await this.qualityMonitoringContract.read(
				'getQualityThresholds',
				args.serialize()
			);

			if (result.value) {
				// Parse the returned values - this would depend on the exact return format
				// For now, returning a mock structure
				return {
					temperatureMin: 0,
					temperatureMax: 30,
					humidityMin: 0,
					humidityMax: 80
				};
			}

			return null;
		} catch (error) {
			console.error('Failed to get quality thresholds:', error);
			return null;
		}
	}

	/**
	 * Check if quality monitoring is enabled for a product
	 */
	async isQualityMonitoringEnabled(productId: string): Promise<boolean> {
		await this.initializeContracts();

		if (!this.qualityMonitoringContract) {
			return false;
		}

		try {
			const args = new Args().addString(productId);

			const result = await this.qualityMonitoringContract.read(
				'isMonitoringEnabled',
				args.serialize()
			);

			return result.value ? true : false;
		} catch (error) {
			console.error('Failed to check monitoring status:', error);
			return false;
		}
	}

	/**
	 * Get quality alerts for a product
	 */
	async getQualityAlerts(productId: string): Promise<QualityAlert[]> {
		await this.initializeContracts();

		if (!this.qualityMonitoringContract) {
			return [];
		}

		try {
			const args = new Args().addString(productId);

			const result = await this.qualityMonitoringContract.read(
				'getQualityAlerts',
				args.serialize()
			);

			// Parse alerts from result - for now return empty array
			// In a real implementation, this would parse the binary result
			console.log('Quality alerts result:', result);
			return [];
		} catch (error) {
			console.error('Failed to get quality alerts:', error);
			return [];
		}
	}

	/**
	 * Initialize ASC configuration for a newly minted product
	 */
	async initializeASCForProduct(productId: string, config: ASCConfiguration): Promise<boolean> {
		if (!config.enableQualityMonitoring) {
			console.log('Quality monitoring disabled for product:', productId);
			return true;
		}

		if (!config.temperatureThreshold || !config.humidityThreshold) {
			console.error('Temperature and humidity thresholds required when monitoring is enabled');
			return false;
		}

		// Set reasonable default ranges based on the thresholds
		const thresholds: QualityThresholds = {
			temperatureMin: 0,
			temperatureMax: config.temperatureThreshold,
			humidityMin: 0,
			humidityMax: config.humidityThreshold
		};

		const operationId = await this.setQualityThresholds(productId, thresholds);
		return !!operationId;
	}

	/**
	 * Get contract addresses for debugging
	 */
	getContractAddresses() {
		return {
			qualityMonitoring: CONFIG.contracts.qualityMonitoring,
			logisticsTracking: CONFIG.contracts.logisticsTracking,
			marketplace: CONFIG.contracts.marketplace
		};
	}
}

// Export singleton instance
export const ascService = new ASCService();
