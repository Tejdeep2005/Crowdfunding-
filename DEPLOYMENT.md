# Deployment Guide

Coinbase Wallet will not work reliably against your local Hardhat node from a public browser session, so this project needs:

1. A public frontend URL
2. A smart contract deployed to a public testnet

This project is now prepared for `Sepolia`.

## 1. Deploy the smart contract

Create `web3/.env` from `web3/.env.example`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
```

Then run:

```powershell
cd web3
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

Save the deployed contract address that the script prints.

## 2. Configure the frontend

Create `client/.env` from `client/.env.example`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://rpc.sepolia.org
VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
```

Then test locally:

```powershell
cd client
npm install
npm run build
```

## 3. Deploy the frontend

### Vercel

1. Push the project to GitHub.
2. Import the `client` folder into Vercel.
3. Set the same `VITE_*` environment variables in the Vercel dashboard.
4. Deploy.

Build settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Netlify

1. Push the project to GitHub.
2. Import the `client` folder into Netlify.
3. Set the same `VITE_*` environment variables.
4. Deploy with:
   - Build command: `npm run build`
   - Publish directory: `dist`

## 4. Connect Coinbase Wallet

1. Open the deployed URL, not `localhost`.
2. Connect Coinbase Wallet.
3. Approve switching to `Sepolia` if the wallet prompts you.
4. Use Sepolia ETH from a faucet for testing.

## Notes

- The frontend now reads the contract address and chain settings from environment variables instead of a hardcoded localhost contract.
- Campaign deadlines are now sent in Unix seconds, which matches the Solidity contract.
