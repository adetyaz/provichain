import { Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, bytesToString } from '@massalabs/as-types';

// Storage key prefixes
const REQUEST_PREFIX = 'request:';
const MANUFACTURER_REQUESTS_PREFIX = 'mfg_requests:';
const CONSUMER_REQUESTS_PREFIX = 'consumer_requests:';
const REQUEST_COUNTER_KEY = 'request_counter';

// Request status constants
const STATUS_PENDING = 'pending';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';
const STATUS_FULFILLED = 'fulfilled';

/**
 * MarketplaceASC - Product Request Management System
 * Handles product requests between consumers and manufacturers
 * Integrated with access control and product registry
 */

let accessControlAddress: string = '';
let productRegistryAddress: string = '';

/**
 * Contract constructor
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  if (!Context.isDeployingContract()) return;

  const args = new Args(binaryArgs);
  accessControlAddress = args
    .nextString()
    .expect('Access Control address is required');
  productRegistryAddress = args
    .nextString()
    .expect('Product Registry address is required');

  // Store the contract addresses
  Storage.set(
    stringToBytes('access_control'),
    stringToBytes(accessControlAddress),
  );
  Storage.set(
    stringToBytes('product_registry'),
    stringToBytes(productRegistryAddress),
  );

  // Initialize request counter
  Storage.set(stringToBytes(REQUEST_COUNTER_KEY), stringToBytes('0'));

  generateEvent('MarketplaceASC deployed successfully');
}

/**
 * Product Request structure
 */
class ProductRequest {
  requestId: string;
  productId: string;
  consumerId: string;
  manufacturerId: string;
  quantity: u32;
  shippingAddressHash: string;
  message: string;
  status: string;
  requestedAt: string;
  processedAt: string;
  rejectionReason: string;

  constructor(
    requestId: string,
    productId: string,
    consumerId: string,
    manufacturerId: string,
    quantity: u32,
    shippingAddressHash: string,
    message: string,
  ) {
    this.requestId = requestId;
    this.productId = productId;
    this.consumerId = consumerId;
    this.manufacturerId = manufacturerId;
    this.quantity = quantity;
    this.shippingAddressHash = shippingAddressHash;
    this.message = message;
    this.status = STATUS_PENDING;
    this.requestedAt = Context.timestamp().toString();
    this.processedAt = '';
    this.rejectionReason = '';
  }

  /**
   * Convert to JSON string for storage
   */
  toJson(): string {
    return `{
      "requestId": "${this.requestId}",
      "productId": "${this.productId}",
      "consumerId": "${this.consumerId}",
      "manufacturerId": "${this.manufacturerId}",
      "quantity": ${this.quantity},
      "shippingAddressHash": "${this.shippingAddressHash}",
      "message": "${this.message}",
      "status": "${this.status}",
      "requestedAt": "${this.requestedAt}",
      "processedAt": "${this.processedAt}",
      "rejectionReason": "${this.rejectionReason}"
    }`;
  }

  /**
   * Parse from JSON string
   * Simple JSON parsing without regex for AssemblyScript
   */
  static fromJson(json: string): ProductRequest {
    const request = new ProductRequest('', '', '', '', 0, '', '');

    // Simple JSON parsing using indexOf and substring
    let startIndex: i32 = 0;
    let endIndex: i32 = 0;

    // Parse requestId
    startIndex = json.indexOf('"requestId":"') + 13;
    if (startIndex > 12) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.requestId = json.substring(startIndex, endIndex);
      }
    }

    // Parse productId
    startIndex = json.indexOf('"productId":"') + 13;
    if (startIndex > 12) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.productId = json.substring(startIndex, endIndex);
      }
    }

    // Parse consumerId
    startIndex = json.indexOf('"consumerId":"') + 14;
    if (startIndex > 13) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.consumerId = json.substring(startIndex, endIndex);
      }
    }

    // Parse manufacturerId
    startIndex = json.indexOf('"manufacturerId":"') + 18;
    if (startIndex > 17) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.manufacturerId = json.substring(startIndex, endIndex);
      }
    }

    // Parse quantity
    startIndex = json.indexOf('"quantity":') + 11;
    if (startIndex > 10) {
      endIndex = json.indexOf(',', startIndex);
      if (endIndex === -1) endIndex = json.indexOf('}', startIndex);
      if (endIndex > startIndex) {
        const quantityStr = json.substring(startIndex, endIndex).trim();
        request.quantity = u32(parseInt(quantityStr));
      }
    }

    // Parse shippingAddressHash
    startIndex = json.indexOf('"shippingAddressHash":"') + 23;
    if (startIndex > 22) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.shippingAddressHash = json.substring(startIndex, endIndex);
      }
    }

    // Parse message
    startIndex = json.indexOf('"message":"') + 11;
    if (startIndex > 10) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.message = json.substring(startIndex, endIndex);
      }
    }

    // Parse status
    startIndex = json.indexOf('"status":"') + 10;
    if (startIndex > 9) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.status = json.substring(startIndex, endIndex);
      }
    }

    // Parse requestedAt
    startIndex = json.indexOf('"requestedAt":"') + 15;
    if (startIndex > 14) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.requestedAt = json.substring(startIndex, endIndex);
      }
    }

    // Parse processedAt
    startIndex = json.indexOf('"processedAt":"') + 15;
    if (startIndex > 14) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.processedAt = json.substring(startIndex, endIndex);
      }
    }

    // Parse rejectionReason
    startIndex = json.indexOf('"rejectionReason":"') + 19;
    if (startIndex > 18) {
      endIndex = json.indexOf('"', startIndex);
      if (endIndex > startIndex) {
        request.rejectionReason = json.substring(startIndex, endIndex);
      }
    }

    return request;
  }
}

/**
 * Create a new product request
 * Only consumers can create requests
 */
export function createProductRequest(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const requestId = args.nextString().expect('Request ID is required');
  const productId = args.nextString().expect('Product ID is required');
  const quantity = args.nextU32().expect('Quantity is required');
  const manufacturerId = args
    .nextString()
    .expect('Manufacturer ID is required');
  const shippingAddressHash = args
    .nextString()
    .expect('Shipping address hash is required');

  // Message is optional - check if there's another string argument
  let message = '';
  const messageResult = args.nextString();
  if (messageResult.isOk()) {
    message = messageResult.unwrap();
  }

  const consumerId = Context.caller().toString();

  // Verify the request doesn't already exist
  const requestKey = REQUEST_PREFIX + requestId;
  if (Storage.has(stringToBytes(requestKey))) {
    generateEvent(`Error: Request ${requestId} already exists`);
    return;
  }

  // Create the product request
  const request = new ProductRequest(
    requestId,
    productId,
    consumerId,
    manufacturerId,
    quantity,
    shippingAddressHash,
    message,
  );

  // Store the request
  Storage.set(stringToBytes(requestKey), stringToBytes(request.toJson()));

  // Add to manufacturer's request list
  const mfgRequestsKey = MANUFACTURER_REQUESTS_PREFIX + manufacturerId;
  let mfgRequestsList = '';
  if (Storage.has(stringToBytes(mfgRequestsKey))) {
    mfgRequestsList = bytesToString(Storage.get(stringToBytes(mfgRequestsKey)));
  }
  if (mfgRequestsList.length > 0) {
    mfgRequestsList += ',' + requestId;
  } else {
    mfgRequestsList = requestId;
  }
  Storage.set(stringToBytes(mfgRequestsKey), stringToBytes(mfgRequestsList));

  // Add to consumer's request list
  const consumerRequestsKey = CONSUMER_REQUESTS_PREFIX + consumerId;
  let consumerRequestsList = '';
  if (Storage.has(stringToBytes(consumerRequestsKey))) {
    consumerRequestsList = bytesToString(
      Storage.get(stringToBytes(consumerRequestsKey)),
    );
  }
  if (consumerRequestsList.length > 0) {
    consumerRequestsList += ',' + requestId;
  } else {
    consumerRequestsList = requestId;
  }
  Storage.set(
    stringToBytes(consumerRequestsKey),
    stringToBytes(consumerRequestsList),
  );

  // Increment request counter
  let counter = 0;
  if (Storage.has(stringToBytes(REQUEST_COUNTER_KEY))) {
    counter = i32(
      parseInt(bytesToString(Storage.get(stringToBytes(REQUEST_COUNTER_KEY)))),
    );
  }
  counter++;
  Storage.set(
    stringToBytes(REQUEST_COUNTER_KEY),
    stringToBytes(counter.toString()),
  );

  generateEvent(
    `Product request created: ${requestId} for product ${productId} by ${consumerId}`,
  );
}

/**
 * Get pending requests for a manufacturer
 */
export function getPendingRequests(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const manufacturerId = args
    .nextString()
    .expect('Manufacturer ID is required');

  const mfgRequestsKey = MANUFACTURER_REQUESTS_PREFIX + manufacturerId;

  if (!Storage.has(stringToBytes(mfgRequestsKey))) {
    return stringToBytes('[]');
  }

  const requestsList = bytesToString(
    Storage.get(stringToBytes(mfgRequestsKey)),
  );
  if (requestsList.length === 0) {
    return stringToBytes('[]');
  }

  const requestIds = requestsList.split(',');
  const pendingRequests: string[] = [];

  for (let i = 0; i < requestIds.length; i++) {
    const requestKey = REQUEST_PREFIX + requestIds[i];
    if (Storage.has(stringToBytes(requestKey))) {
      const requestJson = bytesToString(Storage.get(stringToBytes(requestKey)));
      const request = ProductRequest.fromJson(requestJson);

      if (request.status === STATUS_PENDING) {
        pendingRequests.push(requestJson);
      }
    }
  }

  // Convert to JSON array
  let result = '[';
  for (let i = 0; i < pendingRequests.length; i++) {
    if (i > 0) result += ',';
    result += pendingRequests[i];
  }
  result += ']';

  return stringToBytes(result);
}

/**
 * Approve a product request
 * Only the manufacturer who received the request can approve it
 */
export function approveRequest(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const requestId = args.nextString().expect('Request ID is required');

  const callerId = Context.caller().toString();
  const requestKey = REQUEST_PREFIX + requestId;

  if (!Storage.has(stringToBytes(requestKey))) {
    generateEvent(`Error: Request ${requestId} not found`);
    return;
  }

  const requestJson = bytesToString(Storage.get(stringToBytes(requestKey)));
  const request = ProductRequest.fromJson(requestJson);

  // Verify the caller is the manufacturer for this request
  if (request.manufacturerId !== callerId) {
    generateEvent(
      `Error: Only manufacturer ${request.manufacturerId} can approve this request`,
    );
    return;
  }

  // Verify request is still pending
  if (request.status !== STATUS_PENDING) {
    generateEvent(
      `Error: Request ${requestId} is not pending (status: ${request.status})`,
    );
    return;
  }

  // Update request status
  request.status = STATUS_APPROVED;
  request.processedAt = Context.timestamp().toString();

  // Save updated request
  Storage.set(stringToBytes(requestKey), stringToBytes(request.toJson()));

  generateEvent(`Request approved: ${requestId} by manufacturer ${callerId}`);
}

/**
 * Reject a product request
 * Only the manufacturer who received the request can reject it
 */
export function rejectRequest(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const requestId = args.nextString().expect('Request ID is required');
  const reason = args.nextString().expect('Rejection reason is required');

  const callerId = Context.caller().toString();
  const requestKey = REQUEST_PREFIX + requestId;

  if (!Storage.has(stringToBytes(requestKey))) {
    generateEvent(`Error: Request ${requestId} not found`);
    return;
  }

  const requestJson = bytesToString(Storage.get(stringToBytes(requestKey)));
  const request = ProductRequest.fromJson(requestJson);

  // Verify the caller is the manufacturer for this request
  if (request.manufacturerId !== callerId) {
    generateEvent(
      `Error: Only manufacturer ${request.manufacturerId} can reject this request`,
    );
    return;
  }

  // Verify request is still pending
  if (request.status !== STATUS_PENDING) {
    generateEvent(
      `Error: Request ${requestId} is not pending (status: ${request.status})`,
    );
    return;
  }

  // Update request status
  request.status = STATUS_REJECTED;
  request.processedAt = Context.timestamp().toString();
  request.rejectionReason = reason;

  // Save updated request
  Storage.set(stringToBytes(requestKey), stringToBytes(request.toJson()));

  generateEvent(
    `Request rejected: ${requestId} by manufacturer ${callerId} - Reason: ${reason}`,
  );
}

/**
 * Get all requests for a consumer
 */
export function getConsumerRequests(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const consumerId = args.nextString().expect('Consumer ID is required');

  const consumerRequestsKey = CONSUMER_REQUESTS_PREFIX + consumerId;

  if (!Storage.has(stringToBytes(consumerRequestsKey))) {
    return stringToBytes('[]');
  }

  const requestsList = bytesToString(
    Storage.get(stringToBytes(consumerRequestsKey)),
  );
  if (requestsList.length === 0) {
    return stringToBytes('[]');
  }

  const requestIds = requestsList.split(',');
  const requests: string[] = [];

  for (let i = 0; i < requestIds.length; i++) {
    const requestKey = REQUEST_PREFIX + requestIds[i];
    if (Storage.has(stringToBytes(requestKey))) {
      const requestJson = bytesToString(Storage.get(stringToBytes(requestKey)));
      requests.push(requestJson);
    }
  }

  // Convert to JSON array
  let result = '[';
  for (let i = 0; i < requests.length; i++) {
    if (i > 0) result += ',';
    result += requests[i];
  }
  result += ']';

  return stringToBytes(result);
}

/**
 * Get a specific request by ID
 */
export function getRequest(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const requestId = args.nextString().expect('Request ID is required');

  const requestKey = REQUEST_PREFIX + requestId;

  if (!Storage.has(stringToBytes(requestKey))) {
    return stringToBytes('{}');
  }

  return Storage.get(stringToBytes(requestKey));
}

/**
 * Mark a request as fulfilled (after delivery)
 * Can be called by logistics provider or manufacturer
 */
export function fulfillRequest(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const requestId = args.nextString().expect('Request ID is required');

  const callerId = Context.caller().toString();
  const requestKey = REQUEST_PREFIX + requestId;

  if (!Storage.has(stringToBytes(requestKey))) {
    generateEvent(`Error: Request ${requestId} not found`);
    return;
  }

  const requestJson = bytesToString(Storage.get(stringToBytes(requestKey)));
  const request = ProductRequest.fromJson(requestJson);

  // Verify request is approved
  if (request.status !== STATUS_APPROVED) {
    generateEvent(
      `Error: Request ${requestId} must be approved before fulfillment (status: ${request.status})`,
    );
    return;
  }

  // Update request status
  request.status = STATUS_FULFILLED;
  request.processedAt = Context.timestamp().toString();

  // Save updated request
  Storage.set(stringToBytes(requestKey), stringToBytes(request.toJson()));

  generateEvent(`Request fulfilled: ${requestId} by ${callerId}`);
}

/**
 * Get total request count
 */
export function getTotalRequestCount(): StaticArray<u8> {
  if (!Storage.has(stringToBytes(REQUEST_COUNTER_KEY))) {
    return stringToBytes('0');
  }
  return Storage.get(stringToBytes(REQUEST_COUNTER_KEY));
}

/**
 * Get contract information
 */
export function getContractInfo(): StaticArray<u8> {
  const info = `{
    "name": "MarketplaceASC",
    "version": "1.0.0",
    "description": "Product Request Management System",
    "totalRequests": "${bytesToString(getTotalRequestCount())}"
  }`;
  return stringToBytes(info);
}
