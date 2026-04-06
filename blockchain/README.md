# VERITAS Blockchain Anchoring

Anchors diploma data hashes to Ethereum Sepolia testnet for tamper detection.

## Setup

1. **Get a free Alchemy account** at https://alchemy.com → create app → copy Sepolia RPC URL

2. **Create a deployer wallet** (MetaMask or `ethers.Wallet.createRandom()`)
   - Get test ETH from https://sepoliafaucet.com

3. **Deploy the contract:**
   ```bash
   cd blockchain
   npm install
   SEPOLIA_RPC_URL=<your-url> DEPLOYER_PRIVATE_KEY=<0x...> npx hardhat run scripts/deploy.ts --network sepolia
   ```

4. **Copy the contract address to `.env`:**
   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<key>
   DEPLOYER_PRIVATE_KEY=0x...
   CONTRACT_ADDRESS=0x...
   ```

5. **Done** — diplomas created from now on will be anchored automatically.

## Without blockchain

If `CONTRACT_ADDRESS` is not set, all blockchain features are silently disabled. Existing functionality is unaffected.

## Local tests

```bash
cd blockchain && npm install && npm test
```
