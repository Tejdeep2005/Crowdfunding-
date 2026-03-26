const { ethers } = require("hardhat");

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying CrowdFunding contract to network ${network.name} (chainId ${network.chainId})...`);

  const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
  const crowdFunding = await CrowdFunding.deploy();

  await crowdFunding.deployed();

  console.log("CrowdFunding deployed to:", crowdFunding.address);
  console.log("\nNext steps:");
  console.log(`1. Copy this address: ${crowdFunding.address}`);
  console.log("2. Add it to client/.env as VITE_CONTRACT_ADDRESS");
  console.log(`3. Set VITE_CHAIN_ID=${network.chainId}`);
  console.log("4. Build and deploy the frontend to Vercel or Netlify");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
