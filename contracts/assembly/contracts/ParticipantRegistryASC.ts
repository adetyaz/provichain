import {
  Context,
  generateEvent,
  Storage,
  Address,
  call,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage keys
const PARTICIPANT_PREFIX = 'participant:';
const ROLE_PREFIX = 'role:';
const CONTACT_PREFIX = 'contact:';
const DID_MAPPING_PREFIX = 'did_mapping:';

// Role categories
const ROLE_MANUFACTURER = 'MANUFACTURER';
const ROLE_LOGISTICS = 'LOGISTICS';
const ROLE_RETAILER = 'RETAILER';
const ROLE_AUDITOR = 'AUDITOR';
const ROLE_REGULATOR = 'REGULATOR';
const ROLE_CONSUMER = 'CONSUMER';

/**
 * ParticipantRegistryASC - Participant Profile & Categorization
 * Stores core on-chain profiles of all ProviChain participants
 * Links Massa addresses and DIDs to human-readable names and roles
 */

/**
 * Contract constructor
 * @param binaryArgs - Contains: didRegistryAddress
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  if (!Context.isDeployingContract()) return;

  const args = new Args(binaryArgs);
  const didRegistryAddress = args
    .nextString()
    .expect('DID Registry address is missing');

  // Store the DID Registry contract address for validation
  Storage.set(
    stringToBytes('DID_REGISTRY_ADDRESS'),
    stringToBytes(didRegistryAddress),
  );

  generateEvent(
    `ParticipantRegistryASC deployed with DID Registry: ${didRegistryAddress}`,
  );
}

/**
 * Register a new participant in the supply chain
 * @param binaryArgs - Contains: participantAddress, didUri, name, roleCategory, contactInfo
 */
export function registerParticipant(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const participantAddress = args
    .nextString()
    .expect('Participant address is missing');
  const didUri = args.nextString().expect('DID URI is missing');
  const name = args.nextString().expect('Name is missing');
  const roleCategory = args.nextString().expect('Role category is missing');
  const contactInfo = args.nextString().expect('Contact info is missing');

  // Validate role category
  if (!isValidRole(roleCategory)) {
    generateEvent(`Error: Invalid role category: ${roleCategory}`);
    return;
  }

  // Check if participant already exists
  const existingParticipant = Storage.get(
    stringToBytes(PARTICIPANT_PREFIX + participantAddress),
  );
  if (existingParticipant.length > 0) {
    generateEvent('Error: Participant already registered');
    return;
  }

  // Call DID Registry to verify DID ownership
  const didRegistryAddress = bytesToString(
    Storage.get(stringToBytes('DID_REGISTRY_ADDRESS')),
  );

  // Call DID Registry to verify DID ownership
  const verifyArgs = new Args().add(didUri).add(participantAddress);
  const verificationResult = call(
    new Address(didRegistryAddress),
    'verifyDIDOwnership',
    verifyArgs,
    0,
  );

  const isOwner = bytesToString(verificationResult);
  if (isOwner !== 'true') {
    generateEvent(
      'Error: DID not owned by participant address or DID does not exist',
    );
    return;
  }

  // Store participant information
  const participantData = `${name}|${roleCategory}|${didUri}`;
  Storage.set(
    stringToBytes(PARTICIPANT_PREFIX + participantAddress),
    stringToBytes(participantData),
  );
  Storage.set(
    stringToBytes(ROLE_PREFIX + participantAddress),
    stringToBytes(roleCategory),
  );
  Storage.set(
    stringToBytes(CONTACT_PREFIX + participantAddress),
    stringToBytes(contactInfo),
  );
  Storage.set(
    stringToBytes(DID_MAPPING_PREFIX + didUri),
    stringToBytes(participantAddress),
  );

  generateEvent(
    `Participant registered: ${name} (${roleCategory}) at ${participantAddress} with DID ${didUri}`,
  );
}

/**
 * Update participant information (non-critical info only)
 * @param binaryArgs - Contains: participantAddress, newName, newContactInfo
 */
export function updateParticipantInfo(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const participantAddress = args
    .nextString()
    .expect('Participant address is missing');
  const newName = args.nextString().expect('New name is missing');
  const newContactInfo = args
    .nextString()
    .expect('New contact info is missing');

  // Check if participant exists
  const existingData = Storage.get(
    stringToBytes(PARTICIPANT_PREFIX + participantAddress),
  );
  if (existingData.length === 0) {
    generateEvent('Error: Participant not found');
    return;
  }

  // Only the participant themselves can update their info
  const caller = Context.caller().toString();
  if (caller !== participantAddress) {
    generateEvent(
      'Error: Only the participant can update their own information',
    );
    return;
  }

  // Parse existing data to preserve role and DID
  const existingDataStr = bytesToString(existingData);
  const parts = existingDataStr.split('|');
  if (parts.length !== 3) {
    generateEvent('Error: Invalid participant data format');
    return;
  }

  const roleCategory = parts[1];
  const didUri = parts[2];

  // Update with new name but preserve role and DID
  const updatedData = `${newName}|${roleCategory}|${didUri}`;
  Storage.set(
    stringToBytes(PARTICIPANT_PREFIX + participantAddress),
    stringToBytes(updatedData),
  );
  Storage.set(
    stringToBytes(CONTACT_PREFIX + participantAddress),
    stringToBytes(newContactInfo),
  );

  generateEvent(
    `Participant info updated: ${newName} at ${participantAddress}`,
  );
}

/**
 * Get participant details
 * @param binaryArgs - Contains: participantAddress
 * @returns Participant data as string: "name|role|didUri|contactInfo"
 */
export function getParticipantDetails(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const participantAddress = args
    .nextString()
    .expect('Participant address is missing');

  const participantData = Storage.get(
    stringToBytes(PARTICIPANT_PREFIX + participantAddress),
  );
  if (participantData.length === 0) {
    return stringToBytes(''); // Participant not found
  }

  const contactInfo = Storage.get(
    stringToBytes(CONTACT_PREFIX + participantAddress),
  );
  const contactInfoStr =
    contactInfo.length > 0 ? bytesToString(contactInfo) : '';

  // Return combined data: "name|role|didUri|contactInfo"
  return stringToBytes(bytesToString(participantData) + '|' + contactInfoStr);
}

/**
 * Get participant role
 * @param binaryArgs - Contains: participantAddress
 * @returns Role category as string
 */
export function getParticipantRole(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const participantAddress = args
    .nextString()
    .expect('Participant address is missing');

  const roleData = Storage.get(stringToBytes(ROLE_PREFIX + participantAddress));
  return roleData;
}

/**
 * Get participant address from DID
 * @param binaryArgs - Contains: didUri
 * @returns Participant address as string
 */
export function getParticipantByDID(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const didUri = args.nextString().expect('DID URI is missing');

  const addressData = Storage.get(stringToBytes(DID_MAPPING_PREFIX + didUri));
  return addressData;
}

/**
 * Check if participant has specific role
 * @param binaryArgs - Contains: participantAddress, requiredRole
 * @returns 'true' if participant has the role, 'false' otherwise
 */
export function hasRole(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const participantAddress = args
    .nextString()
    .expect('Participant address is missing');
  const requiredRole = args.nextString().expect('Required role is missing');

  const roleData = Storage.get(stringToBytes(ROLE_PREFIX + participantAddress));
  if (roleData.length === 0) {
    return stringToBytes('false');
  }

  const currentRole = bytesToString(roleData);
  return stringToBytes(currentRole === requiredRole ? 'true' : 'false');
}

/**
 * Validate if role category is valid
 */
function isValidRole(role: string): bool {
  return (
    role === ROLE_MANUFACTURER ||
    role === ROLE_LOGISTICS ||
    role === ROLE_RETAILER ||
    role === ROLE_AUDITOR ||
    role === ROLE_REGULATOR ||
    role === ROLE_CONSUMER
  );
}

/**
 * Get all valid roles (for frontend use)
 * @returns Comma-separated list of valid roles
 */
export function getValidRoles(): StaticArray<u8> {
  const roles = `${ROLE_MANUFACTURER},${ROLE_LOGISTICS},${ROLE_RETAILER},${ROLE_AUDITOR},${ROLE_REGULATOR},${ROLE_CONSUMER}`;
  return stringToBytes(roles);
}

/**
 * Check if participant is registered
 * @param binaryArgs - Contains: participantAddress
 * @returns 'true' if registered, 'false' otherwise
 */
export function isParticipantRegistered(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const participantAddress = args
    .nextString()
    .expect('Participant address is missing');

  const participantData = Storage.get(
    stringToBytes(PARTICIPANT_PREFIX + participantAddress),
  );
  return stringToBytes(participantData.length > 0 ? 'true' : 'false');
}
