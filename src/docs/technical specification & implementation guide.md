# Technical Specification & Implementation Guide

### Technical Summary

ProviChain is a platform for Real-World Asset (RWA) tokenization, specifically tailored for supply chain management. Our core mission is to bring transparency, immutability, and automation to physical asset journeys, from manufacturing to delivery. We leverage the **Massa blockchain** as our foundation, utilizing its unique features like **Autonomous Smart Contracts (ASCs)** for self-executing logic and **On-Chain Web Hosting (DeWeb)** for a censorship-resistant frontend.

This document details the architectural decisions, component specifications, development workflow, and critical technical considerations for building ProviChain.

For initial development, we will implement **simulated real-world data inputs** to enable comprehensive testing of our on-chain logic without immediate reliance on physical IoT systems. Our frontend will be built with **Svelte 5** and interact with the Massa network via the **Massa TypeScript SDK (`@massalabs/massa-web3`)**.

### Architectural Overview

ProviChain employs a robust, multi-layered architecture designed for decentralization, scalability, and security.

- **Layer 1 (Blockchain Core): Massa Network**
  - **Consensus:** Proof-of-Stake (PoS) with Blockclique architecture, enabling high throughput (targeting 10,000 TPS) and parallel transaction processing.
  - **Execution Environment:** WebAssembly (WASM) Virtual Machine.
  - **Smart Contract Language:** AssemblyScript (compiled to WASM).
  - **Key Massa Features Utilized:**
    - **Autonomous Smart Contracts (ASCs):** For self-triggering, time-based, or event-driven on-chain logic (e.g., automated quality checks, payment releases).
    - **On-Chain Web Hosting (DeWeb):** Hosting the entire Svelte frontend directly on the Massa blockchain for censorship resistance and immutability.
    - **Decentralized Name Service (MNS):** For human-readable `.massa` domain names (e.g., `provichain.massa`).
- **Layer 2 (Smart Contracts - On-Chain Logic):**
  - **`ProductPassport.ts`:** Core NFT contract (MRC-721/1155 compliant) representing tokenized physical assets, managing mutable metadata, and immutable provenance history.
  - **`ProviChainRegistry.ts`:** Manages asset type registration and orchestration of NFT minting.
  - **`DIDRegistry.ts`:** Custom smart contract for managing Decentralized Identifiers (DIDs) and their associated public keys/service endpoints on Massa. This forms the backbone for identity verification and access control.
  - **`AccessControl.ts`:** Role-Based Access Control (RBAC) contract, leveraging `DIDRegistry` for permissioning.
  - **Autonomous Smart Contracts (ASCs):**
    - `QualityMonitorASC.ts`: Monitors product conditions (e.g., temperature) and triggers alerts/actions.
    - `PaymentAutomatorASC.ts`: Automates payments based on supply chain milestones.
- **Layer 3 (Off-Chain Integration & Services - Initial Simulation):**
  - **Simulated Oracle Network:** For MVP, this involves Svelte frontend components and/or local Node.js scripts that manually push "simulated sensor data" and "attestations" onto the blockchain.
  - **Decentralized Storage (IPFS and Arweave):** For storing large files associated with NFTs (e.g., high-res images, certifications, documents).
  - **External KYC/AML Providers:** (Future integration) For off-chain identity verification, with on-chain proofs or attestations linked to DIDs.
- **Layer 4 (Frontend - User Interface): Svelte 5**
  - Developed using Svelte 5's reactive components and stores.
  - Interacts with Massa via the `@massalabs/massa-web3` TypeScript SDK.
  - Will be deployed entirely to Massa's DeWeb.

#### Frontend (Svelte 5 on DeWeb)

- **Framework:** Svelte 5 (with Runes for reactivity, `$derived`, `$state`, `$effect`).
- **Massa SDK:** `@massalabs/massa-web3` and `@massalabs/wallet-provider` for connecting to MassaStation/MetaMask Snap.
- **Architecture:** Modular Svelte components, using Svelte stores for shared state (e.g., wallet connection status, selected NFT data).
- **Key SDK Interactions:**
  - **Wallet Connection:**

```
<script lang="ts">
    import { writable } from 'svelte/store';
    import { MassaWalletProvider, Wallets } from '@massalabs/wallet-provider';
    import { ClientFactory, Default }, type IMassaClient } from '@massalabs/massa-web3';

    const connectedClient = writable<IMassaClient | null>(null);
    const userAddress = writable<string | null>(null);

    async function connectWallet() {
        try {
            const client = await ClientFactory.createDefaultClient(Default.BUILDNET_RPC_URL); // Or local DevNet URL
            const walletProvider = await MassaWalletProvider.get<Wallets.MASSASTATION>(); // Or Wallets.BEARBY, Wallets.METAMASK
            await walletProvider.connect();
            const accounts = await walletProvider.get");
            if (accounts && accounts.length > 0) {
                $userAddress = accounts[0].address;
                $connectedClient = client;
                // Set the wallet provider for the client
                client.set)
                console.log("Connected to Massa with address:", $userAddress);
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    }
</script>

{#if !$userAddress}
    <button on:click={connectWallet}>Connect Massa Wallet</button>
{:else}
    <p>Connected as: {$userAddress}</p>
{/if}
```

- Smart Contract Interaction (Read-Only):

```
<script lang="ts">
    import { SmartContract, Args, type IMassaClient } from '@massalabs/massa-web3';
    import { getContext } from 'svelte';
    import { connectedClient } from './stores'; // Assuming you have a Svelte store for the client

    let productPassportContract: SmartContract;
    let currentTemp = $state<string>('');
    let tokenId = $state<string>('0'); // Example token ID

    $effect(() => {
        const client = $connectedClient;
        if (client) {
            // Replace with your deployed ProductPassport contract address
            productPassportContract = new SmartContract(client, "AS1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
            fetchTemperature();
        }
    });

    async function fetchTemperature() {
        try {
            const args = new Args().addU256(tokenId).addString("currentTemperature");
            const result = await productPassportContract.readSmartContractPublicFunction("getMetadata", args);
            if (result.value) {
                currentTemp = new TextDecoder().decode(result.value);
            } else {
                currentTemp = 'N/A';
            }
        } catch (error) {
            console.error("Failed to fetch temperature:", error);
        }
    }
</script>

<p>Product ID: {tokenId}</p>
<p>Current Temperature: {currentTemp}</p>
<button onclick={fetchTemperature}>Refresh Temperature</button>
```

- Smart Contract Interaction (Write/Transaction):

```
<script lang="ts">
    import { SmartContract, Args, type IMassaClient, IAccount, Coin, WalletClient } from '@massalabs/massa-web3';
    import { connectedClient, userAddress } from './stores'; // Svelte stores

    let productPassportContract: SmartContract;
    let tokenId = $state<string>('0');
    let newTemperature = $state<string>('');
    let statusMessage = $state<string>('');

    $effect(() => {
        const client = $connectedClient;
        if (client) {
            productPassportContract = new SmartContract(client, "AS1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        }
    });

    async function updateProductTemperature() {
        if (!$userAddress || !productPassportContract) {
            statusMessage = "Please connect wallet first.";
            return;
        }

        try {
            statusMessage = "Updating temperature...";
            const args = new Args()
                .addU256(tokenId)
                .addString("currentTemperature")
                .addString(newTemperature)
                .addString(`did:massa:${$userAddress}`); // Use connected wallet as simulated DID

            // Assuming the connected wallet (via wallet-provider) is set as the client's wallet
            const opId = await productPassportContract.callSmartContractPublicFunction(
                "updateMetadata",
                args,
                Coin.fromMAS(0.01), // Coins to attach (e.g., 0 for just data update)
                Coin.fromMAS(0.001), // Fee
                2_000_000 // Max gas
            );
            statusMessage = `Transaction sent! Operation ID: ${opId}`;
            const operation = await productPassportContract.client.get and then
            statusMessage = `Transaction final! Check block: ${operation.opId}`;
        } catch (error: any) {
            console.error("Failed to update temperature:", error);
            statusMessage = `Error: ${error.message || error.toString()}`;
        }
    }
</script>

<form onsubmit|preventDefault={updateProductTemperature}>
    <label>
        Product ID:
        <input type="text" bind:value={tokenId} />
    </label>
    <label>
        New Temperature:
        <input type="text" bind:value={newTemperature} placeholder="e.g., 25.0C" />
    </label>
    <button type="submit">Simulate Sensor Update</button>
    <p>{statusMessage}</p>
</form>

```

#### Simulated Oracle Network Integration

For MVP, "oracles" are implemented as specific UI components or scripts.

- **"Simulated Sensor Input" Component (Svelte):**
  - Provides inputs for `tokenId`, `sensorType` (e.g., "temperature", "gps"), `value`.
  - On submission, uses `massa-web3` to call `ProductPassport.updateMetadata()` for the specified `tokenId` with the simulated `key` and `value`.
  - **Attester DID:** Uses the currently connected wallet's Massa address as the `attesterDID` for authorization.
- **"Supply Chain Event Attestor" Component (Svelte):**
  - Provides inputs for `tokenId`, `eventType` (dropdown: "Shipped", "Received", "Inspected", "Damaged"), `details` (text area).
  - On submission, uses `massa-web3` to call `ProductPassport.logEvent()` for the specified `tokenId`.
  - **Attester DID:** Uses the connected wallet's Massa address as the `attesterDID`.

#### Decentralized Storage Integration (IPFS and Arweave)

We're strategic about where we store data:

- IPFS (with pinning services): For high-availability, potentially dynamic data like high-resolution product images or aggregated simulated sensor logs. We'll store the CID (Content Identifier) on-chain.

- Arweave (one-time payment): For permanent, immutable archival of critical documents like official certifications, audit reports, or legal documents. We'll store the Arweave Transaction ID on-chain.

- **Frontend Integration:**
  - Use of JavaScript client library, `ipfs-http-client` for IPFS and `arweave-js` for Arweave to upload files.
  - Receive the content hash (CID for IPFS, transaction ID for Arweave).
  - Store this hash on the `ProductPassport` NFT's metadata using `updateMetadata()`.
- **Smart Contract Interaction:** The smart contract only stores the _hash_ of the file, not the file itself. This keeps on-chain storage minimal and efficient.

#### Developer Workflow & Tooling (Svelte-centric)

1. **Local Dev Environment Setup:**
   - **Massa Node:** Run a local Massa BuildNet: `git clone https://github.com/massalabs/massa.git && cd massa && cargo build --release --features sandbox && cargo run --features sandbox`.
   - **Massa Client:** `cd massa-client && cargo run` for CLI interactions (e.g., generating keys, deploying initial contracts if not using SDK scripts).
   - **Massa AS-SDK:** `npm install -g @massalabs/massa-as-sdk` for smart contract compilation.
   - **Massa Web3 SDK:** `npm install @massalabs/massa-web3 @massalabs/wallet-provider` in your Svelte project.
   - **SvelteKit:** `npm create svelte@latest provichain. Choose SvelteKit, TypeScript, ESLint, Prettier.
   - **Code Editor:** VS Code (with Svelte, TypeScript, and AssemblyScript extensions).

2. **Smart Contract Development (AssemblyScript):**
   - Create `src/contracts/*.ts` files.
   - Compile: `npx asc src/contracts/ProductPassport.ts --outFile build/ProductPassport.wasm --optimize`.
   - Write deployment scripts in TypeScript using `massa-web3` for DevNet/TestNet. These scripts will load the `.wasm` bytecode and deploy it.
   - Write unit tests for smart contracts using AssemblyScript's built-in testing capabilities.

3. **Frontend Development (Svelte 5):**
   - Develop Svelte components (`.svelte` files) for the UI.
   - Use `$state`, `$derived`, `$effect` runes for reactive state management.
   - Utilize Svelte stores for global state (e.g., connected wallet, contract instances).
   - Interact with Massa smart contracts using the `massa-web3` SDK as shown in section 3.2.
   - Set up a local development server: `npm run dev`.

4. **DeWeb Deployment:**
   - Build SvelteKit for static deployment: `npm run build` (ensure `adapter-static` is configured in `svelte.config.js`). This generates your static site in a `build` directory.
   - Zip the contents: `cd build && zip -r ../frontend.zip .`.
   - Deploy using Massa CLI: `massa-client web-deploy --file frontend.zip --domain provichain.massa --private-key <your_deployer_key>`.
   - Alternatively, use `massa-web3` to programmatically deploy: `await client.web.deployWebsite(zipFileBytes, 'provichain.massa', privateKey);`.
   - Register MNS domain (if not already done).

5. **CI/CD:** Automate testing (unit, integration), smart contract compilation, and deployments to DevNet/TestNet using GitHub Actions or GitLab CI.

### User Flows & Use Cases

This flow demonstrates the initial interaction a user has with ProviChain.

**User Flow Diagram:**

![alt text](<../../static/user-flows/Connecting Wallet & Viewing Product.svg>)

**Technical Flow**

1. **Svelte App Initialization:**
   - `src/app.html`: Base HTML, loads SvelteKit app.
   - `src/routes/+layout.svelte`: Global layout, contains wallet connection logic (`MassaWalletProvider`, `ClientFactory`).
   - A Svelte writable store (`stores.ts`) like `connectedClient` and `userAddress` is used to hold the `IMassaClient` instance and the user's Massa address.

2. **Wallet Connection (`+layout.svelte` / `WalletConnect.svelte` component):**
   - `connectWallet` function (as shown in 3.2) is called `onMount` or by user click.
   - It uses `MassaWalletProvider.get<Wallets.MASSASTATION>().connect()` to initiate connection.
   - `client.setWalletProvider(walletProvider)` ensures subsequent transactions are signed by the connected wallet.
   - `userAddress.set(accounts[0].address)` updates the store.

3. **Displaying Products (`routes/products/+page.svelte`):**
   - `$effect` or `onMount` blocks react to `$connectedClient` store.
   - Instantiate `productPassportContract = new SmartContract($connectedClient, contractAddress)`.
   - Call `productPassportContract.readSmartContractPublicFunction("getMetadata", ...)` and `productPassportContract.readSmartContractPublicFunction("getProvenance", ...)`.
   - Results are `$state` variables or reactive stores in Svelte, updating the UI.

#### Use Case 1: Manufacturer Onboards & Mints New Product NFTs

**Scenario:** A verified garment manufacturer wants to tokenize a new batch of shirts for a global fashion brand.

**User Flow Diagram:**

![alt text](<../../static/user-flows/Manufacturer Onboards & Mints New Product NFTs.svg>)

**Technical Flow**

1. **Authentication & Authorization (`DIDService.ts` / Svelte component):**
   - On login, the frontend gets the user's Massa address.
   - Calls `didRegistryContract.readSmartContractPublicFunction("resolveDIDAddress", args)` to get their DID.
   - Calls `accessControlContract.readSmartContractPublicFunction("hasRole", new Args().addString(userDID).addString("manufacturer"))` to verify role.
   - Svelte `$state` and `$derived` are used to control UI element visibility based on role.

2. **Product Details Form (`routes/manufacturer/new-product/+page.svelte`):**
   - Svelte form elements for text inputs (model, material, batch ID).
   - File input for certifications.

3. **IPFS Upload (`IPFSService.ts`):**
   - A utility service handles `ipfsClient.add(file)` to upload.
   - Returns the CID.

4. **Minting Transaction:**

- `mintProductBatch` function in component:

**Code Snippet**

```
import { SmartContract, Args, Coin } from '@massalabs/massa-web3';
import { connectedClient, userAddress } from '../../stores'; // Assuming stores
import { getIpfsClient } from '../../services/ipfs';

// ... (contract instance and form data setup)

async function mintProduct() {
    if (!$connectedClient || !$userAddress || !registryContract || !productPassportContract) return;
    try {
        // 1. Upload initial certifications to IPFS
        const ipfsClient = getIpfsClient(); // Initialize your IPFS client
        const result = await ipfsClient.add(selectedCertificationFile);
        const ipfsHash = result.path;

        // 2. Prepare initial product details
        const initialDetails = new Args()
            .addString(productModel)
            .addString(productMaterial)
            .addString(batchId)
            .addString(ipfsHash);

        // 3. Call the ProviChainRegistry.createProduct function
        const operation = await registryContract.callSmartContractPublicFunction(
            "createProduct",
            initialDetails,
            Coin.fromMAS(0.1), // Example coins
            Coin.fromMAS(0.001), // Fee
            5_000_000 // Max gas
        );
        await operation.waitFinalExecution();
        console.log("Product batch minted! Operation ID:", operation.opId);
        // Fetch new product NFTs or display success
    } catch (error) {
        console.error("Minting failed:", error);
    }
}

```

- The `ProviChainRegistry` contract then interacts with `ProductPassport.mint()` on-chain.

5.  **Confirmation & Display:** Svelte updates UI, perhaps navigates to a "My Products" page which fetches and displays the newly minted NFT details.

#### Use Case 2: Logistics Provider Updates Location (Simulated Tracking)

**Scenario:** A logistics company transports the shirts. At each checkpoint (e.g., warehouse, port), they update the physical location.

**User Flow Diagram:**

![alt text](<../../static/user-flows/Logistics Provider Updates Location.svg>)

**Technical Flow**

1. **Login & Role Check:** Similar to Use Case 1.
2. **Shipment View (`routes/logistics/shipments/[id]/+page.svelte`):**
   - Component fetches current NFT details using `productPassportContract.readSmartContractPublicFunction("getMetadata", ...)`
3. **Update Location Form (`UpdateLocation.svelte` component):**
   - Input field for new GPS coordinates/location name.
   - Button to trigger `updateLocation` function.
4. **Update Metadata Transaction (Simulated Sensor/Attestor):**

**Code Snippet**

```
import { SmartContract, Args, Coin } from '@massalabs/massa-web3';
import { connectedClient, userAddress } from '../../stores';

// ... (contract instance and form data setup)

async function updateLocation() {
    if (!$connectedClient || !$userAddress || !productPassportContract) return;
    try {
        statusMessage = "Sending location update...";
        const args = new Args()
            .addU256(tokenId)
            .addString("currentLocation")
            .addString(newLocation)
            .addString(`did:massa:${$userAddress}`); // Connected user is the attester

        const op = await productPassportContract.callSmartContractPublicFunction(
            "updateMetadata",
            args,
            Coin.fromMAS(0),
            Coin.fromMAS(0.001),
            1_000_000
        );
        await op.waitFinalExecution();
        statusMessage = "Location updated successfully!";
        // Optionally, refresh metadata display
        fetchCurrentLocation();
    } catch (error) {
        console.error("Location update failed:", error);
        statusMessage = `Error: ${error.message}`;
    }
}

```

5. **Confirmation:** Svelte UI updates based on transaction success, reflecting the new location.

#### Use Case 3: Autonomous Quality Monitoring (ASC Trigger)

**Scenario:** A shirt batch is being transported and contains a temperature sensor. If the temperature exceeds a threshold for a sustained period, an alert is automatically logged, and a simulated insurance claim is triggered.

**User Flow Diagram:**

![alt text](<../../static/user-flows/Autonomous Quality Monitoring (ASC Trigger).svg>)

**Technical Flow**

1. **Simulated Sensor Script (`scripts/simulate-temp-sensor.ts`):**
   - A Node.js script using `massa-web3`.
   - Configured with a `tokenId` and a Massa private key (for `attesterDID`).
   - Uses a `setInterval` to periodically (e.g., every 30 seconds) construct a transaction to call `ProductPassport.updateMetadata()` with a simulated temperature value (can be random, or follow a pattern to trigger the alert).

**Code Snippet**

```
import { ClientFactory, Default, WalletClient, SmartContract, Args, Coin } from '@massalabs/massa-web3';
import { readFileSync } from 'fs';

const PRIVATE_KEY = readFileSync('./wallet.key', 'utf8'); // Load deployer key
const PRODUCT_PASSPORT_ADDR = "AS1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const CLIENT = await ClientFactory.createCustomClient(
    [{ url: Default.BUILDNET_RPC_URL, is ); // Or DevNet RPC
const WALLET_CLIENT = await WalletClient.create(CLIENT, PRIVATE_KEY);
CLIENT.setWalletClient(WALLET_CLIENT);

const productPassportContract = new SmartContract(CLIENT, PRODUCT_PASSPORT_ADDR);
const tokenId = BigInt(0); // Assuming the first NFT minted

async function simulateTemperature() {
    try {
        const currentTemp = (Math.random() * 10 + 20).toFixed(1) + "C"; // Temp between 20-30C
        const attesterDID = `did:massa:${WALLET_CLIENT.getPublicAddress()}`;

        const args = new Args()
            .addU256(tokenId)
            .addString("currentTemperature")
            .addString(currentTemp)
            .addString(attesterDID);

        const op = await productPassportContract.callSmartContractPublicFunction(
            "updateMetadata",
            args,
            Coin.fromMAS(0),
            Coin.fromMAS(0.001),
            1_000_000
        );
        console.log(`Temp updated to ${currentTemp}. Op ID: ${op}`);
        await CLIENT.get.get);
        console.log("Transaction finalized.");

    } catch (error) {
        console.error("Simulated sensor error:", error);
    }
}

setInterval(simulateTemperature, 30_000); // Update every 30 seconds
```

1. **`QualityMonitorASC.ts` (AssemblyScript Smart Contract):**
   - This contract would be deployed to Massa, and its `checkConditions` function would be scheduled to run autonomously using `Context.scheduleCall`.
   - It would read the `currentTemperature` from the `ProductPassport` contract's state (as described in 3.1).

2. **Frontend Observation:**
   - A Svelte component displaying the NFT details would continuously poll or listen for events from the `ProductPassport` contract to show `currentTemperature` and any new `QualityAlert` events.
