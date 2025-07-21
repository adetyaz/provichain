import {
  Context,
  generateEvent,
  Storage,
  Address,
  call,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage keys
const ROLE_PREFIX = 'role:';
const PERMISSION_PREFIX = 'permission:';
const ADMIN_PREFIX = 'admin:';
const FUNCTION_PERMISSION_PREFIX = 'func_perm:';
const ROLE_ADMIN_PREFIX = 'role_admin:';

// Core roles hierarchy
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
const ADMIN_ROLE = 'ADMIN';
const AUDITOR_ROLE = 'AUDITOR';
const MANUFACTURER_ROLE = 'MANUFACTURER';
const LOGISTICS_ROLE = 'LOGISTICS';
const RETAILER_ROLE = 'RETAILER';
const CONSUMER_ROLE = 'CONSUMER';

// Special internal roles
const CONTRACT_ADMIN_ROLE = 'CONTRACT_ADMIN';
const SYSTEM_ROLE = 'SYSTEM';

/**
 * AccessControlASC - Granular Permission Management System
 * Central authority for all access rights in ProviChain
 * Implements role-based access control with function-level permissions
 */

/**
 * Contract constructor
 * @param binaryArgs - Contains: initialAdmin address, participantRegistryAddress
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  if (!Context.isDeployingContract()) return;

  const args = new Args(binaryArgs);
  const initialAdmin = args
    .nextString()
    .expect('Initial admin address is missing');
  const participantRegistryAddress = args
    .nextString()
    .expect('Participant registry address is missing');

  // Store dependent contract addresses
  Storage.set(
    stringToBytes('PARTICIPANT_REGISTRY_ADDRESS'),
    stringToBytes(participantRegistryAddress),
  );

  // Grant deployer SUPER_ADMIN role
  Storage.set(
    stringToBytes(ROLE_PREFIX + initialAdmin + ':' + SUPER_ADMIN_ROLE),
    stringToBytes('true'),
  );

  // Set up role hierarchy (who can manage which roles)
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + SUPER_ADMIN_ROLE),
    stringToBytes(SUPER_ADMIN_ROLE),
  );
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + ADMIN_ROLE),
    stringToBytes(SUPER_ADMIN_ROLE),
  );
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + AUDITOR_ROLE),
    stringToBytes(ADMIN_ROLE),
  );
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + MANUFACTURER_ROLE),
    stringToBytes(ADMIN_ROLE),
  );
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + LOGISTICS_ROLE),
    stringToBytes(ADMIN_ROLE),
  );
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + RETAILER_ROLE),
    stringToBytes(ADMIN_ROLE),
  );
  Storage.set(
    stringToBytes(ROLE_ADMIN_PREFIX + CONSUMER_ROLE),
    stringToBytes(ADMIN_ROLE),
  );

  generateEvent(`AccessControlASC deployed. Super Admin: ${initialAdmin}`);
}

/**
 * Grant a role to an account
 * @param binaryArgs - Contains: account, role
 */
export function grantRole(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const account = args.nextString().expect('Account address is missing');
  const role = args.nextString().expect('Role is missing');
  const caller = Context.caller().toString();

  // Check if caller has permission to grant this role
  if (!canGrantRole(caller, role)) {
    generateEvent(`Error: ${caller} cannot grant role ${role}`);
    return;
  }

  // Verify account is a registered participant (except for SUPER_ADMIN)
  if (role !== SUPER_ADMIN_ROLE && !isRegisteredParticipant(account)) {
    generateEvent(
      'Error: Account must be a registered participant to receive roles',
    );
    return;
  }

  // Grant the role
  Storage.set(
    stringToBytes(ROLE_PREFIX + account + ':' + role),
    stringToBytes('true'),
  );

  generateEvent(`Role ${role} granted to ${account} by ${caller}`);
}

/**
 * Revoke a role from an account
 * @param binaryArgs - Contains: account, role
 */
export function revokeRole(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const account = args.nextString().expect('Account address is missing');
  const role = args.nextString().expect('Role is missing');
  const caller = Context.caller().toString();

  // Check if caller has permission to revoke this role
  if (!canGrantRole(caller, role)) {
    generateEvent(`Error: ${caller} cannot revoke role ${role}`);
    return;
  }

  // Cannot revoke SUPER_ADMIN from the last super admin
  if (role === SUPER_ADMIN_ROLE && isLastSuperAdmin(account)) {
    generateEvent('Error: Cannot revoke SUPER_ADMIN from the last super admin');
    return;
  }

  // Revoke the role
  Storage.set(
    stringToBytes(ROLE_PREFIX + account + ':' + role),
    stringToBytes('false'),
  );

  generateEvent(`Role ${role} revoked from ${account} by ${caller}`);
}

/**
 * Check if an account has a specific role
 * @param binaryArgs - Contains: account, role
 * @returns 'true' if account has the role, 'false' otherwise
 */
export function hasRole(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const account = args.nextString().expect('Account address is missing');
  const role = args.nextString().expect('Role is missing');

  const roleKey = stringToBytes(ROLE_PREFIX + account + ':' + role);
  const roleValue = Storage.get(roleKey);

  if (roleValue.length === 0) {
    return stringToBytes('false');
  }

  return stringToBytes(bytesToString(roleValue) === 'true' ? 'true' : 'false');
}

/**
 * Set function-level permissions for a role
 * @param binaryArgs - Contains: role, targetContract, functionName, canExecute
 */
export function setFunctionPermission(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const role = args.nextString().expect('Role is missing');
  const targetContract = args.nextString().expect('Target contract is missing');
  const functionName = args.nextString().expect('Function name is missing');
  const canExecute = args.nextString().expect('Can execute flag is missing');
  const caller = Context.caller().toString();

  // Only SUPER_ADMIN can set function permissions
  if (!hasRoleInternal(caller, SUPER_ADMIN_ROLE)) {
    generateEvent('Error: Only SUPER_ADMIN can set function permissions');
    return;
  }

  const permissionKey = `${role}:${targetContract}:${functionName}`;
  Storage.set(
    stringToBytes(FUNCTION_PERMISSION_PREFIX + permissionKey),
    stringToBytes(canExecute),
  );

  generateEvent(
    `Function permission set: ${role} can${
      canExecute === 'true' ? '' : 'not'
    } execute ${functionName} on ${targetContract}`,
  );
}

/**
 * Check if an account has permission to execute a function
 * @param binaryArgs - Contains: account, targetContract, functionName
 * @returns 'true' if account has permission, 'false' otherwise
 */
export function hasFunctionPermission(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const account = args.nextString().expect('Account address is missing');
  const targetContract = args.nextString().expect('Target contract is missing');
  const functionName = args.nextString().expect('Function name is missing');

  // SUPER_ADMIN has all permissions
  if (hasRoleInternal(account, SUPER_ADMIN_ROLE)) {
    return stringToBytes('true');
  }

  // Check each role the account has
  const roles = [
    ADMIN_ROLE,
    AUDITOR_ROLE,
    MANUFACTURER_ROLE,
    LOGISTICS_ROLE,
    RETAILER_ROLE,
    CONSUMER_ROLE,
  ];

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    if (hasRoleInternal(account, role)) {
      const permissionKey = `${role}:${targetContract}:${functionName}`;
      const permission = Storage.get(
        stringToBytes(FUNCTION_PERMISSION_PREFIX + permissionKey),
      );

      if (permission.length > 0 && bytesToString(permission) === 'true') {
        return stringToBytes('true');
      }
    }
  }

  return stringToBytes('false');
}

/**
 * Get all roles for an account
 * @param binaryArgs - Contains: account
 * @returns Comma-separated list of roles
 */
export function getAccountRoles(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const account = args.nextString().expect('Account address is missing');

  const roles = [
    SUPER_ADMIN_ROLE,
    ADMIN_ROLE,
    AUDITOR_ROLE,
    MANUFACTURER_ROLE,
    LOGISTICS_ROLE,
    RETAILER_ROLE,
    CONSUMER_ROLE,
  ];
  const accountRoles: string[] = [];

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    if (hasRoleInternal(account, role)) {
      accountRoles.push(role);
    }
  }

  return stringToBytes(accountRoles.join(','));
}

/**
 * Request role assignment (self-service for participants)
 * @param binaryArgs - Contains: requestedRole, justification
 */
export function requestRole(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const requestedRole = args.nextString().expect('Requested role is missing');
  const justification = args.nextString().expect('Justification is missing');
  const caller = Context.caller().toString();

  // Must be a registered participant
  if (!isRegisteredParticipant(caller)) {
    generateEvent('Error: Must be a registered participant to request roles');
    return;
  }

  // Cannot request SUPER_ADMIN or ADMIN roles
  if (requestedRole === SUPER_ADMIN_ROLE || requestedRole === ADMIN_ROLE) {
    generateEvent('Error: Cannot self-request admin roles');
    return;
  }

  // Get participant's registered role from ParticipantRegistry
  const participantRole = getParticipantRegisteredRole(caller);

  // Role must match participant's registered category or be CONSUMER
  if (requestedRole !== participantRole && requestedRole !== CONSUMER_ROLE) {
    generateEvent(
      `Error: Requested role ${requestedRole} does not match registered participant role ${participantRole}`,
    );
    return;
  }

  // Auto-approve if role matches registered participant role
  if (requestedRole === participantRole) {
    Storage.set(
      stringToBytes(ROLE_PREFIX + caller + ':' + requestedRole),
      stringToBytes('true'),
    );
    generateEvent(
      `Role ${requestedRole} auto-approved for registered participant ${caller}`,
    );
  } else {
    // Log request for admin approval
    generateEvent(
      `Role request: ${caller} requests ${requestedRole}. Justification: ${justification}`,
    );
  }
}

/**
 * Emergency role revocation (for security incidents)
 * @param binaryArgs - Contains: account, reason
 */
export function emergencyRevokeAllRoles(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const account = args.nextString().expect('Account address is missing');
  const reason = args.nextString().expect('Reason is missing');
  const caller = Context.caller().toString();

  // Only SUPER_ADMIN can perform emergency revocation
  if (!hasRoleInternal(caller, SUPER_ADMIN_ROLE)) {
    generateEvent(
      'Error: Only SUPER_ADMIN can perform emergency role revocation',
    );
    return;
  }

  // Cannot revoke from SUPER_ADMIN (except if there are multiple super admins)
  if (hasRoleInternal(account, SUPER_ADMIN_ROLE) && isLastSuperAdmin(account)) {
    generateEvent('Error: Cannot revoke all roles from the last SUPER_ADMIN');
    return;
  }

  // Revoke all roles
  const roles = [
    SUPER_ADMIN_ROLE,
    ADMIN_ROLE,
    AUDITOR_ROLE,
    MANUFACTURER_ROLE,
    LOGISTICS_ROLE,
    RETAILER_ROLE,
    CONSUMER_ROLE,
  ];

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    Storage.set(
      stringToBytes(ROLE_PREFIX + account + ':' + role),
      stringToBytes('false'),
    );
  }

  generateEvent(
    `Emergency: All roles revoked from ${account}. Reason: ${reason}`,
  );
}

// Internal helper functions

/**
 * Internal role check (no external call)
 */
function hasRoleInternal(account: string, role: string): bool {
  const roleKey = stringToBytes(ROLE_PREFIX + account + ':' + role);
  const roleValue = Storage.get(roleKey);
  return roleValue.length > 0 && bytesToString(roleValue) === 'true';
}

/**
 * Check if caller can grant a specific role
 */
function canGrantRole(caller: string, role: string): bool {
  // SUPER_ADMIN can grant any role
  if (hasRoleInternal(caller, SUPER_ADMIN_ROLE)) {
    return true;
  }

  // Get role admin from hierarchy
  const roleAdminData = Storage.get(stringToBytes(ROLE_ADMIN_PREFIX + role));
  if (roleAdminData.length === 0) {
    return false;
  }

  const requiredRole = bytesToString(roleAdminData);
  return hasRoleInternal(caller, requiredRole);
}

/**
 * Check if account is registered in ParticipantRegistry
 */
function isRegisteredParticipant(account: string): bool {
  const participantRegistryAddress = bytesToString(
    Storage.get(stringToBytes('PARTICIPANT_REGISTRY_ADDRESS')),
  );

  const checkArgs = new Args().add(account);
  const isRegistered = call(
    new Address(participantRegistryAddress),
    'isParticipantRegistered',
    checkArgs,
    0,
  );

  return bytesToString(isRegistered) === 'true';
}

/**
 * Get participant's registered role category
 */
function getParticipantRegisteredRole(account: string): string {
  const participantRegistryAddress = bytesToString(
    Storage.get(stringToBytes('PARTICIPANT_REGISTRY_ADDRESS')),
  );

  const roleArgs = new Args().add(account);
  const roleResult = call(
    new Address(participantRegistryAddress),
    'getParticipantRole',
    roleArgs,
    0,
  );

  return bytesToString(roleResult);
}

/**
 * Check if this is the last SUPER_ADMIN
 */
function isLastSuperAdmin(account: string): bool {
  // This is a simplified check - in production, you'd track all super admins
  // For now, assume if they have SUPER_ADMIN role, they might be the last one
  return hasRoleInternal(account, SUPER_ADMIN_ROLE);
}

/**
 * Get all available roles
 * @returns Comma-separated list of all roles
 */
export function getAllRoles(): StaticArray<u8> {
  const roles = `${SUPER_ADMIN_ROLE},${ADMIN_ROLE},${AUDITOR_ROLE},${MANUFACTURER_ROLE},${LOGISTICS_ROLE},${RETAILER_ROLE},${CONSUMER_ROLE}`;
  return stringToBytes(roles);
}
