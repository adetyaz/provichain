import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage keys
const DID_PREFIX = 'did:';
const CONTROLLER_PREFIX = 'controller:';
const DOCUMENT_PREFIX = 'document:';
const REVOKED_PREFIX = 'revoked:';

/**
 * DIDRegistryASC - Decentralized Identifier Registry
 * Manages and anchors Decentralized Identifiers (DIDs) on the Massa blockchain
 * Foundation for self-sovereign identity in ProviChain
 */

/**
 * Contract constructor - called once during deployment
 * @param binaryArgs - Arguments serialized with Args
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // Ensure this function can only be called during deployment
  if (!Context.isDeployingContract()) return;

  generateEvent('DIDRegistryASC deployed successfully');
}

/**
 * Register a new DID on the blockchain
 * Links a unique DID to a Massa address
 *
 * @param binaryArgs - Contains: didUri, controllerAddress, didDocumentHash
 */
export function registerDID(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');
  const controllerAddress = args
    .nextString()
    .expect('Controller address is missing or invalid');
  const didDocumentHash = args
    .nextString()
    .expect('DID document hash is missing or invalid');

  // Validate DID format - more flexible, just needs to start with 'did:'
  if (!didUri.startsWith('did:')) {
    generateEvent('Error: Invalid DID format - must start with "did:"');
    return;
  }

  // Validate controller address format (Massa address should be longer)
  if (controllerAddress.length < 40) {
    generateEvent('Error: Invalid controller address format');
    return;
  }

  // Check if DID already exists
  const existingController = Storage.get(
    stringToBytes(CONTROLLER_PREFIX + didUri),
  );
  if (existingController.length > 0) {
    generateEvent('Error: DID already registered');
    return;
  }

  // Store DID mapping
  Storage.set(
    stringToBytes(CONTROLLER_PREFIX + didUri),
    stringToBytes(controllerAddress),
  );
  Storage.set(
    stringToBytes(DOCUMENT_PREFIX + didUri),
    stringToBytes(didDocumentHash),
  );

  generateEvent(`DID registered: ${didUri} controlled by ${controllerAddress}`);
}

/**
 * Update DID Document hash (only by controller)
 * Allows DID owner to update associated DID Document
 *
 * @param binaryArgs - Contains: didUri, newDidDocumentHash
 */
export function updateDID(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');
  const newDidDocumentHash = args
    .nextString()
    .expect('New DID document hash is missing or invalid');

  // Check if DID exists
  const controllerBytes = Storage.get(
    stringToBytes(CONTROLLER_PREFIX + didUri),
  );
  if (controllerBytes.length === 0) {
    generateEvent('Error: DID not found');
    return;
  }

  const controller = bytesToString(controllerBytes);
  const caller = Context.caller().toString();

  // Verify caller is the controller
  if (caller !== controller) {
    generateEvent('Error: Only DID controller can update the document');
    return;
  }

  // Check if DID is revoked
  const revokedBytes = Storage.get(stringToBytes(REVOKED_PREFIX + didUri));
  if (revokedBytes.length > 0 && bytesToString(revokedBytes) === 'true') {
    generateEvent('Error: Cannot update revoked DID');
    return;
  }

  // Update DID document hash
  Storage.set(
    stringToBytes(DOCUMENT_PREFIX + didUri),
    stringToBytes(newDidDocumentHash),
  );

  generateEvent(
    `DID updated: ${didUri} new document hash: ${newDidDocumentHash}`,
  );
}

/**
 * Revoke a DID (mark as invalid)
 * Only the controller can revoke their DID
 *
 * @param binaryArgs - Contains: didUri
 */
export function revokeDID(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');

  // Check if DID exists
  const controllerBytes = Storage.get(
    stringToBytes(CONTROLLER_PREFIX + didUri),
  );
  if (controllerBytes.length === 0) {
    generateEvent('Error: DID not found');
    return;
  }

  const controller = bytesToString(controllerBytes);
  const caller = Context.caller().toString();

  // Verify caller is the controller
  if (caller !== controller) {
    generateEvent('Error: Only DID controller can revoke the DID');
    return;
  }

  // Mark as revoked
  Storage.set(stringToBytes(REVOKED_PREFIX + didUri), stringToBytes('true'));

  generateEvent(`DID revoked: ${didUri}`);
}

/**
 * Get DID controller address
 * Resolves a DID to its controlling Massa address
 *
 * @param binaryArgs - Contains: didUri
 * @returns Controller address as string
 */
export function getDIDController(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');

  const controllerBytes = Storage.get(
    stringToBytes(CONTROLLER_PREFIX + didUri),
  );
  if (controllerBytes.length === 0) {
    return stringToBytes(''); // DID not found
  }

  return controllerBytes;
}

/**
 * Get DID document hash
 *
 * @param binaryArgs - Contains: didUri
 * @returns DID document hash as string
 */
export function getDIDDocument(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');

  const documentBytes = Storage.get(stringToBytes(DOCUMENT_PREFIX + didUri));
  return documentBytes;
}

/**
 * Check if DID is revoked
 *
 * @param binaryArgs - Contains: didUri
 * @returns 'true' if revoked, 'false' otherwise
 */
export function isDIDRevoked(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');

  const revokedBytes = Storage.get(stringToBytes(REVOKED_PREFIX + didUri));
  if (revokedBytes.length === 0) {
    return stringToBytes('false');
  }

  return revokedBytes;
}

/**
 * Verify DID ownership
 * Check if a specific address controls a DID
 *
 * @param binaryArgs - Contains: didUri, addressToCheck
 * @returns 'true' if address controls the DID, 'false' otherwise
 */
export function verifyDIDOwnership(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing or invalid');
  const addressToCheck = args
    .nextString()
    .expect('Address to check is missing or invalid');

  const controllerBytes = Storage.get(
    stringToBytes(CONTROLLER_PREFIX + didUri),
  );
  if (controllerBytes.length === 0) {
    return stringToBytes('false'); // DID not found
  }

  const controller = bytesToString(controllerBytes);

  // Check if DID is revoked
  const revokedBytes = Storage.get(stringToBytes(REVOKED_PREFIX + didUri));
  if (revokedBytes.length > 0 && bytesToString(revokedBytes) === 'true') {
    return stringToBytes('false'); // Revoked DIDs cannot be verified
  }

  return stringToBytes(controller === addressToCheck ? 'true' : 'false');
}
