import {
  Address,
  generateEvent,
  Storage,
  createEvent,
  Context,
  transferCoins,
  Coins,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage keys
const QUALITY_DATA_KEY = stringToBytes('QUALITY_DATA_');
const PRODUCT_THRESHOLDS_KEY = stringToBytes('THRESHOLDS_');
const ALERTS_KEY = stringToBytes('ALERTS_');
const AUTHORIZED_UPDATERS_KEY = stringToBytes('UPDATERS_');

// Quality data structure
export class QualityReading {
  constructor(
    public productId: string = '',
    public temperature: f32 = 0.0,
    public humidity: f32 = 0.0,
    public timestamp: u64 = 0,
    public location: string = '',
    public updatedBy: string = '',
    public notes: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add(this.productId)
      .add(this.temperature)
      .add(this.humidity)
      .add(this.timestamp)
      .add(this.location)
      .add(this.updatedBy)
      .add(this.notes);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): QualityReading {
    const args = new Args(data);
    return new QualityReading(
      args.nextString().expect('Failed to deserialize productId'),
      args.nextF32().expect('Failed to deserialize temperature'),
      args.nextF32().expect('Failed to deserialize humidity'),
      args.nextU64().expect('Failed to deserialize timestamp'),
      args.nextString().expect('Failed to deserialize location'),
      args.nextString().expect('Failed to deserialize updatedBy'),
      args.nextString().expect('Failed to deserialize notes'),
    );
  }
}

// Quality thresholds
export class QualityThresholds {
  constructor(
    public productId: string = '',
    public minTemperature: f32 = 0.0,
    public maxTemperature: f32 = 30.0,
    public minHumidity: f32 = 0.0,
    public maxHumidity: f32 = 70.0,
    public alertsEnabled: bool = true,
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add(this.productId)
      .add(this.minTemperature)
      .add(this.maxTemperature)
      .add(this.minHumidity)
      .add(this.maxHumidity)
      .add(this.alertsEnabled);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): QualityThresholds {
    const args = new Args(data);
    return new QualityThresholds(
      args.nextString().expect('Failed to deserialize productId'),
      args.nextF32().expect('Failed to deserialize minTemperature'),
      args.nextF32().expect('Failed to deserialize maxTemperature'),
      args.nextF32().expect('Failed to deserialize minHumidity'),
      args.nextF32().expect('Failed to deserialize maxHumidity'),
      args.nextBool().expect('Failed to deserialize alertsEnabled'),
    );
  }
}

// Quality alert
export class QualityAlert {
  constructor(
    public productId: string = '',
    public alertType: string = '',
    public message: string = '',
    public severity: string = '',
    public timestamp: u64 = 0,
    public resolved: bool = false,
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add(this.productId)
      .add(this.alertType)
      .add(this.message)
      .add(this.severity)
      .add(this.timestamp)
      .add(this.resolved);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): QualityAlert {
    const args = new Args(data);
    return new QualityAlert(
      args.nextString().expect('Failed to deserialize productId'),
      args.nextString().expect('Failed to deserialize alertType'),
      args.nextString().expect('Failed to deserialize message'),
      args.nextString().expect('Failed to deserialize severity'),
      args.nextU64().expect('Failed to deserialize timestamp'),
      args.nextBool().expect('Failed to deserialize resolved'),
    );
  }
}

/**
 * Initialize the Quality Monitoring contract
 * @param args - No arguments required
 */
export function constructor(args: StaticArray<u8>): void {
  // Contract is ready to use
  generateEvent('QualityMonitoringASC initialized');
}

/**
 * Set quality thresholds for a product
 * @param args - Serialized QualityThresholds
 */
export function setQualityThresholds(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const minTemp = argsObj.nextF32().expect('Missing minTemperature');
  const maxTemp = argsObj.nextF32().expect('Missing maxTemperature');
  const minHumidity = argsObj.nextF32().expect('Missing minHumidity');
  const maxHumidity = argsObj.nextF32().expect('Missing maxHumidity');
  const alertsEnabled = argsObj.nextBool().expect('Missing alertsEnabled');

  const thresholds = new QualityThresholds(
    productId,
    minTemp,
    maxTemp,
    minHumidity,
    maxHumidity,
    alertsEnabled,
  );

  const key = PRODUCT_THRESHOLDS_KEY.concat(stringToBytes(productId));
  Storage.set(key, thresholds.serialize());

  generateEvent(`Quality thresholds set for product ${productId}`);
}

/**
 * Authorize an address to update quality data
 * @param args - Address to authorize
 */
export function authorizeUpdater(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const updaterAddress = argsObj.nextString().expect('Missing updater address');

  const key = AUTHORIZED_UPDATERS_KEY.concat(stringToBytes(updaterAddress));
  Storage.set(key, stringToBytes('authorized'));

  generateEvent(`Authorized ${updaterAddress} to update quality data`);
}

/**
 * Check if an address is authorized to update quality data
 * @param args - Address to check
 */
export function isAuthorizedUpdater(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const updaterAddress = argsObj.nextString().expect('Missing updater address');

  const key = AUTHORIZED_UPDATERS_KEY.concat(stringToBytes(updaterAddress));
  const result = Storage.has(key);

  return new Args().add(result).serialize();
}

/**
 * Update quality data for a product (manual IoT simulation)
 * @param args - Serialized quality data
 */
export function updateQualityData(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const temperature = argsObj.nextF32().expect('Missing temperature');
  const humidity = argsObj.nextF32().expect('Missing humidity');
  const location = argsObj.nextString().expect('Missing location');
  const notes = argsObj.nextString().expect('Missing notes');

  const caller = Context.caller().toString();
  const timestamp = Context.timestamp();

  // Check if caller is authorized (for now, allow any caller for simulation)
  // In production, uncomment this:
  // const authKey = AUTHORIZED_UPDATERS_KEY.concat(stringToBytes(caller));
  // assert(Storage.has(authKey), 'Caller not authorized to update quality data');

  const reading = new QualityReading(
    productId,
    temperature,
    humidity,
    timestamp,
    location,
    caller,
    notes,
  );

  // Store the reading
  const readingKey = QUALITY_DATA_KEY.concat(stringToBytes(productId))
    .concat(stringToBytes('_'))
    .concat(stringToBytes(timestamp.toString()));
  Storage.set(readingKey, reading.serialize());

  // Check thresholds and create alerts if needed
  checkThresholds(productId, temperature, humidity, timestamp);

  generateEvent(
    `Quality data updated for product ${productId} - Temp: ${temperature}°C, Humidity: ${humidity}%`,
  );
}

/**
 * Get latest quality data for a product
 * @param args - Product ID
 */
export function getLatestQualityData(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  // In a real implementation, we'd iterate through readings to find the latest
  // For now, return a default reading
  const defaultReading = new QualityReading(
    productId,
    25.0,
    65.0,
    Context.timestamp(),
    'Unknown',
    'System',
    'Default reading',
  );

  return defaultReading.serialize();
}

/**
 * Get quality thresholds for a product
 * @param args - Product ID
 */
export function getQualityThresholds(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  const key = PRODUCT_THRESHOLDS_KEY.concat(stringToBytes(productId));

  if (Storage.has(key)) {
    return Storage.get(key);
  }

  // Return default thresholds
  const defaultThresholds = new QualityThresholds(
    productId,
    0.0,
    30.0,
    0.0,
    70.0,
    true,
  );

  return defaultThresholds.serialize();
}

/**
 * Get active alerts for a product
 * @param args - Product ID
 */
export function getActiveAlerts(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  // For now, return empty array (no active alerts)
  // In a real implementation, we'd iterate through stored alerts
  const alertsCount = 0;

  const result = new Args();
  result.add(alertsCount);

  return result.serialize();
}

/**
 * Resolve a quality alert
 * @param args - Product ID and alert ID
 */
export function resolveAlert(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const alertId = argsObj.nextString().expect('Missing alertId');

  // Mark alert as resolved
  const alertKey = ALERTS_KEY.concat(stringToBytes(productId))
    .concat(stringToBytes('_'))
    .concat(stringToBytes(alertId));

  if (Storage.has(alertKey)) {
    const alertData = Storage.get(alertKey);
    const alert = QualityAlert.deserialize(alertData);
    alert.resolved = true;
    Storage.set(alertKey, alert.serialize());

    generateEvent(`Alert ${alertId} resolved for product ${productId}`);
  }
}

/**
 * Internal function to check thresholds and create alerts
 */
function checkThresholds(
  productId: string,
  temperature: f32,
  humidity: f32,
  timestamp: u64,
): void {
  const thresholdKey = PRODUCT_THRESHOLDS_KEY.concat(stringToBytes(productId));

  if (!Storage.has(thresholdKey)) {
    return; // No thresholds set
  }

  const thresholdData = Storage.get(thresholdKey);
  const thresholds = QualityThresholds.deserialize(thresholdData);

  if (!thresholds.alertsEnabled) {
    return; // Alerts disabled
  }

  // Check temperature thresholds
  if (
    temperature < thresholds.minTemperature ||
    temperature > thresholds.maxTemperature
  ) {
    const alert = new QualityAlert(
      productId,
      'TEMPERATURE_VIOLATION',
      `Temperature ${temperature}°C is outside acceptable range (${thresholds.minTemperature}°C - ${thresholds.maxTemperature}°C)`,
      'HIGH',
      timestamp,
      false,
    );

    const alertKey = ALERTS_KEY.concat(stringToBytes(productId))
      .concat(stringToBytes('_'))
      .concat(stringToBytes(timestamp.toString()));
    Storage.set(alertKey, alert.serialize());

    generateEvent(`TEMPERATURE ALERT: Product ${productId} - ${alert.message}`);
  }

  // Check humidity thresholds
  if (humidity < thresholds.minHumidity || humidity > thresholds.maxHumidity) {
    const alert = new QualityAlert(
      productId,
      'HUMIDITY_VIOLATION',
      `Humidity ${humidity}% is outside acceptable range (${thresholds.minHumidity}% - ${thresholds.maxHumidity}%)`,
      'HIGH',
      timestamp,
      false,
    );

    const alertKey = ALERTS_KEY.concat(stringToBytes(productId))
      .concat(stringToBytes('_'))
      .concat(stringToBytes(timestamp.toString() + '_humidity'));
    Storage.set(alertKey, alert.serialize());

    generateEvent(`HUMIDITY ALERT: Product ${productId} - ${alert.message}`);
  }
}
