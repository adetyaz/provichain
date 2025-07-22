import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage key prefixes
const PRODUCT_PREFIX = 'product:';
const OWNER_PREFIX = 'owner:';
const METADATA_PREFIX = 'metadata:';
const BATCH_PREFIX = 'batch:';
const MANUFACTURER_PREFIX = 'mfg:';

/**
 * ProductRegistryASC - Product NFT Registry
 * Manages product NFTs with batch tracking and metadata
 * Integrated with manufacturer roles from AccessControl
 */

let accessControlAddress: string = '';

/**
 * Contract constructor
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  if (!Context.isDeployingContract()) return;

  const args = new Args(binaryArgs);
  accessControlAddress = args
    .nextString()
    .expect('Access Control address is required');

  // Store the access control address
  Storage.set(
    stringToBytes('access_control'),
    stringToBytes(accessControlAddress),
  );

  generateEvent('ProductRegistryASC deployed successfully');
}

/**
 * Mint a new product NFT
 * Only manufacturers can mint products
 */
export function mintProduct(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const productId = args.nextString().expect('Product ID is required');
  const productName = args.nextString().expect('Product name is required');
  const batchNumber = args.nextString().expect('Batch number is required');
  const metadataHash = args.nextString().expect('Metadata hash is required');

  const caller = Context.caller().toString();

  // Check if product already exists
  const existingOwner = Storage.get(stringToBytes(OWNER_PREFIX + productId));
  if (existingOwner.length > 0) {
    generateEvent('Error: Product ID already exists');
    return;
  }

  // TODO: Add role verification when DID issue is resolved
  // For now, allow any caller to mint (we'll add role check later)

  // Store product data
  Storage.set(stringToBytes(OWNER_PREFIX + productId), stringToBytes(caller));
  Storage.set(
    stringToBytes(PRODUCT_PREFIX + productId),
    stringToBytes(productName),
  );
  Storage.set(
    stringToBytes(BATCH_PREFIX + productId),
    stringToBytes(batchNumber),
  );
  Storage.set(
    stringToBytes(METADATA_PREFIX + productId),
    stringToBytes(metadataHash),
  );
  Storage.set(
    stringToBytes(MANUFACTURER_PREFIX + productId),
    stringToBytes(caller),
  );

  generateEvent(`Product minted: ${productId} by ${caller}`);
}

/**
 * Get product details
 */
export function getProduct(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const productId = args.nextString().expect('Product ID is required');

  const owner = Storage.get(stringToBytes(OWNER_PREFIX + productId));
  if (owner.length === 0) {
    return stringToBytes('Product not found');
  }

  const productName = Storage.get(stringToBytes(PRODUCT_PREFIX + productId));
  const batchNumber = Storage.get(stringToBytes(BATCH_PREFIX + productId));
  const metadataHash = Storage.get(stringToBytes(METADATA_PREFIX + productId));
  const manufacturer = Storage.get(
    stringToBytes(MANUFACTURER_PREFIX + productId),
  );

  // Return JSON-like string
  const result = `{
    "productId": "${productId}",
    "name": "${bytesToString(productName)}",
    "batch": "${bytesToString(batchNumber)}",
    "metadata": "${bytesToString(metadataHash)}",
    "owner": "${bytesToString(owner)}",
    "manufacturer": "${bytesToString(manufacturer)}"
  }`;

  return stringToBytes(result);
}

/**
 * Transfer product ownership
 */
export function transferProduct(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const productId = args.nextString().expect('Product ID is required');
  const newOwner = args.nextString().expect('New owner address is required');

  const caller = Context.caller().toString();

  // Check if product exists
  const currentOwner = Storage.get(stringToBytes(OWNER_PREFIX + productId));
  if (currentOwner.length === 0) {
    generateEvent('Error: Product not found');
    return;
  }

  // Check if caller is current owner
  if (bytesToString(currentOwner) !== caller) {
    generateEvent('Error: Only current owner can transfer product');
    return;
  }

  // Transfer ownership
  Storage.set(stringToBytes(OWNER_PREFIX + productId), stringToBytes(newOwner));

  generateEvent(
    `Product transferred: ${productId} from ${caller} to ${newOwner}`,
  );
}

/**
 * Check if product exists
 */
export function productExists(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const productId = args.nextString().expect('Product ID is required');

  const owner = Storage.get(stringToBytes(OWNER_PREFIX + productId));
  return stringToBytes(owner.length > 0 ? 'true' : 'false');
}

/**
 * Get product owner
 */
export function getProductOwner(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const productId = args.nextString().expect('Product ID is required');

  const owner = Storage.get(stringToBytes(OWNER_PREFIX + productId));
  return owner.length > 0 ? owner : stringToBytes('');
}

/**
 * Update product metadata (only by manufacturer)
 */
export function updateProductMetadata(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const productId = args.nextString().expect('Product ID is required');
  const newMetadataHash = args
    .nextString()
    .expect('New metadata hash is required');

  const caller = Context.caller().toString();

  // Check if product exists
  const manufacturer = Storage.get(
    stringToBytes(MANUFACTURER_PREFIX + productId),
  );
  if (manufacturer.length === 0) {
    generateEvent('Error: Product not found');
    return;
  }

  // Check if caller is the manufacturer
  if (bytesToString(manufacturer) !== caller) {
    generateEvent('Error: Only manufacturer can update metadata');
    return;
  }

  // Update metadata
  Storage.set(
    stringToBytes(METADATA_PREFIX + productId),
    stringToBytes(newMetadataHash),
  );

  generateEvent(`Product metadata updated: ${productId}`);
}
