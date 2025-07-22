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
const SHIPMENT_DATA_KEY = stringToBytes('SHIPMENT_');
const LOCATION_HISTORY_KEY = stringToBytes('LOCATION_HIST_');
const DELIVERY_STATUS_KEY = stringToBytes('DELIVERY_STATUS_');
const AUTHORIZED_CARRIERS_KEY = stringToBytes('CARRIERS_');

// Shipment status constants
const SHIPMENT_STATUS_CREATED = 'CREATED';
const SHIPMENT_STATUS_PICKED_UP = 'PICKED_UP';
const SHIPMENT_STATUS_IN_TRANSIT = 'IN_TRANSIT';
const SHIPMENT_STATUS_OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY';
const SHIPMENT_STATUS_DELIVERED = 'DELIVERED';
const SHIPMENT_STATUS_DELAYED = 'DELAYED';
const SHIPMENT_STATUS_RETURNED = 'RETURNED';

// Location update structure
export class LocationUpdate {
  constructor(
    public productId: string = '',
    public latitude: f64 = 0.0,
    public longitude: f64 = 0.0,
    public locationName: string = '',
    public timestamp: u64 = 0,
    public carrierAddress: string = '',
    public status: string = SHIPMENT_STATUS_IN_TRANSIT,
    public notes: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add(this.productId)
      .add(this.latitude)
      .add(this.longitude)
      .add(this.locationName)
      .add(this.timestamp)
      .add(this.carrierAddress)
      .add(this.status)
      .add(this.notes);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): LocationUpdate {
    const args = new Args(data);
    return new LocationUpdate(
      args.nextString().expect('Failed to deserialize productId'),
      args.nextF64().expect('Failed to deserialize latitude'),
      args.nextF64().expect('Failed to deserialize longitude'),
      args.nextString().expect('Failed to deserialize locationName'),
      args.nextU64().expect('Failed to deserialize timestamp'),
      args.nextString().expect('Failed to deserialize carrierAddress'),
      args.nextString().expect('Failed to deserialize status'),
      args.nextString().expect('Failed to deserialize notes'),
    );
  }
}

// Shipment information
export class ShipmentInfo {
  constructor(
    public productId: string = '',
    public fromAddress: string = '',
    public toAddress: string = '',
    public carrierAddress: string = '',
    public currentStatus: string = SHIPMENT_STATUS_CREATED,
    public estimatedDelivery: u64 = 0,
    public actualDelivery: u64 = 0,
    public createdAt: u64 = 0,
    public lastUpdated: u64 = 0,
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add(this.productId)
      .add(this.fromAddress)
      .add(this.toAddress)
      .add(this.carrierAddress)
      .add(this.currentStatus)
      .add(this.estimatedDelivery)
      .add(this.actualDelivery)
      .add(this.createdAt)
      .add(this.lastUpdated);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): ShipmentInfo {
    const args = new Args(data);
    return new ShipmentInfo(
      args.nextString().expect('Failed to deserialize productId'),
      args.nextString().expect('Failed to deserialize fromAddress'),
      args.nextString().expect('Failed to deserialize toAddress'),
      args.nextString().expect('Failed to deserialize carrierAddress'),
      args.nextString().expect('Failed to deserialize currentStatus'),
      args.nextU64().expect('Failed to deserialize estimatedDelivery'),
      args.nextU64().expect('Failed to deserialize actualDelivery'),
      args.nextU64().expect('Failed to deserialize createdAt'),
      args.nextU64().expect('Failed to deserialize lastUpdated'),
    );
  }
}

/**
 * Initialize the Logistics Tracking contract
 * @param args - No arguments required
 */
export function constructor(args: StaticArray<u8>): void {
  generateEvent('LogisticsTrackingASC initialized');
}

/**
 * Authorize a carrier to update shipment data
 * @param args - Carrier address
 */
export function authorizeCarrier(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const carrierAddress = argsObj.nextString().expect('Missing carrier address');

  const key = AUTHORIZED_CARRIERS_KEY.concat(stringToBytes(carrierAddress));
  Storage.set(key, stringToBytes('authorized'));

  generateEvent(`Authorized carrier: ${carrierAddress}`);
}

/**
 * Check if an address is an authorized carrier
 * @param args - Address to check
 */
export function isAuthorizedCarrier(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const carrierAddress = argsObj.nextString().expect('Missing carrier address');

  const key = AUTHORIZED_CARRIERS_KEY.concat(stringToBytes(carrierAddress));
  const result = Storage.has(key);

  return new Args().add(result).serialize();
}

/**
 * Create a new shipment
 * @param args - Shipment details
 */
export function createShipment(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const fromAddress = argsObj.nextString().expect('Missing fromAddress');
  const toAddress = argsObj.nextString().expect('Missing toAddress');
  const carrierAddress = argsObj.nextString().expect('Missing carrierAddress');
  const estimatedDelivery = argsObj
    .nextU64()
    .expect('Missing estimatedDelivery');

  const timestamp = Context.timestamp();

  const shipment = new ShipmentInfo(
    productId,
    fromAddress,
    toAddress,
    carrierAddress,
    SHIPMENT_STATUS_CREATED,
    estimatedDelivery,
    0,
    timestamp,
    timestamp,
  );

  const key = SHIPMENT_DATA_KEY.concat(stringToBytes(productId));
  Storage.set(key, shipment.serialize());

  generateEvent(
    `Shipment created for product ${productId} - Carrier: ${carrierAddress}`,
  );
}

/**
 * Update shipment location (manual tracking simulation)
 * @param args - Location update data
 */
export function updateLocation(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const latitude = argsObj.nextF64().expect('Missing latitude');
  const longitude = argsObj.nextF64().expect('Missing longitude');
  const locationName = argsObj.nextString().expect('Missing locationName');
  const status = argsObj.nextString().expect('Missing status');
  const notes = argsObj.nextString().expect('Missing notes');

  const caller = Context.caller().toString();
  const timestamp = Context.timestamp();

  // Check if caller is authorized carrier (for now, allow any caller for simulation)
  // In production, uncomment this:
  // const authKey = AUTHORIZED_CARRIERS_KEY.concat(stringToBytes(caller));
  // assert(Storage.has(authKey), 'Caller not authorized to update shipment');

  // Create location update
  const locationUpdate = new LocationUpdate(
    productId,
    latitude,
    longitude,
    locationName,
    timestamp,
    caller,
    status,
    notes,
  );

  // Store location update in history
  const historyKey = LOCATION_HISTORY_KEY.concat(stringToBytes(productId))
    .concat(stringToBytes('_'))
    .concat(stringToBytes(timestamp.toString()));
  Storage.set(historyKey, locationUpdate.serialize());

  // Update shipment status
  const shipmentKey = SHIPMENT_DATA_KEY.concat(stringToBytes(productId));
  if (Storage.has(shipmentKey)) {
    const shipmentData = Storage.get(shipmentKey);
    const shipment = ShipmentInfo.deserialize(shipmentData);

    shipment.currentStatus = status;
    shipment.lastUpdated = timestamp;

    // If delivered, set actual delivery time
    if (status === SHIPMENT_STATUS_DELIVERED) {
      shipment.actualDelivery = timestamp;
    }

    Storage.set(shipmentKey, shipment.serialize());
  }

  generateEvent(
    `Location updated for product ${productId} - ${locationName} (${status})`,
  );
}

/**
 * Update shipment status
 * @param args - Product ID and new status
 */
export function updateShipmentStatus(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const newStatus = argsObj.nextString().expect('Missing status');
  const notes = argsObj.nextString().expect('Missing notes');

  const caller = Context.caller().toString();
  const timestamp = Context.timestamp();

  const shipmentKey = SHIPMENT_DATA_KEY.concat(stringToBytes(productId));

  if (Storage.has(shipmentKey)) {
    const shipmentData = Storage.get(shipmentKey);
    const shipment = ShipmentInfo.deserialize(shipmentData);

    shipment.currentStatus = newStatus;
    shipment.lastUpdated = timestamp;

    // If delivered, set actual delivery time
    if (newStatus === SHIPMENT_STATUS_DELIVERED) {
      shipment.actualDelivery = timestamp;
    }

    Storage.set(shipmentKey, shipment.serialize());

    generateEvent(
      `Shipment status updated for product ${productId}: ${newStatus} - ${notes}`,
    );
  }
}

/**
 * Get shipment information
 * @param args - Product ID
 */
export function getShipmentInfo(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  const key = SHIPMENT_DATA_KEY.concat(stringToBytes(productId));

  if (Storage.has(key)) {
    return Storage.get(key);
  }

  // Return default shipment info if not found
  const defaultShipment = new ShipmentInfo(
    productId,
    'Unknown',
    'Unknown',
    'Unknown',
    SHIPMENT_STATUS_CREATED,
    0,
    0,
    Context.timestamp(),
    Context.timestamp(),
  );

  return defaultShipment.serialize();
}

/**
 * Get current location for a product
 * @param args - Product ID
 */
export function getCurrentLocation(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  // In a real implementation, we'd get the latest location from history
  // For now, return a default location
  const defaultLocation = new LocationUpdate(
    productId,
    40.7128, // NYC latitude
    -74.006, // NYC longitude
    'New York Distribution Center',
    Context.timestamp(),
    Context.caller().toString(),
    SHIPMENT_STATUS_IN_TRANSIT,
    'Last known location',
  );

  return defaultLocation.serialize();
}

/**
 * Get location history for a product
 * @param args - Product ID
 */
export function getLocationHistory(args: StaticArray<u8>): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  // For now, return count of 0 (no history)
  // In a real implementation, we'd iterate through stored location updates
  const historyCount = 0;

  const result = new Args();
  result.add(historyCount);

  return result.serialize();
}

/**
 * Confirm delivery
 * @param args - Product ID and recipient confirmation
 */
export function confirmDelivery(args: StaticArray<u8>): void {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');
  const recipientSignature = argsObj
    .nextString()
    .expect('Missing recipient signature');

  const timestamp = Context.timestamp();
  const caller = Context.caller().toString();

  // Update shipment status to delivered
  const shipmentKey = SHIPMENT_DATA_KEY.concat(stringToBytes(productId));

  if (Storage.has(shipmentKey)) {
    const shipmentData = Storage.get(shipmentKey);
    const shipment = ShipmentInfo.deserialize(shipmentData);

    shipment.currentStatus = SHIPMENT_STATUS_DELIVERED;
    shipment.actualDelivery = timestamp;
    shipment.lastUpdated = timestamp;

    Storage.set(shipmentKey, shipment.serialize());

    // Store delivery confirmation
    const deliveryKey = DELIVERY_STATUS_KEY.concat(stringToBytes(productId));
    const deliveryInfo = new Args()
      .add(productId)
      .add(timestamp)
      .add(caller)
      .add(recipientSignature)
      .add('CONFIRMED');

    Storage.set(deliveryKey, deliveryInfo.serialize());

    generateEvent(`Delivery confirmed for product ${productId} by ${caller}`);
  }
}

/**
 * Get delivery confirmation
 * @param args - Product ID
 */
export function getDeliveryConfirmation(
  args: StaticArray<u8>,
): StaticArray<u8> {
  const argsObj = new Args(args);
  const productId = argsObj.nextString().expect('Missing productId');

  const deliveryKey = DELIVERY_STATUS_KEY.concat(stringToBytes(productId));

  if (Storage.has(deliveryKey)) {
    return Storage.get(deliveryKey);
  }

  // Return empty confirmation if not found
  const emptyConfirmation = new Args()
    .add(productId)
    .add(0 as u64)
    .add('')
    .add('')
    .add('NOT_CONFIRMED');

  return emptyConfirmation.serialize();
}
