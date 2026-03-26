// Script to create campaigns directly through Hardhat
const { ethers } = require("hardhat");

async function createCampaign() {
  console.log("Creating campaign directly through Hardhat...");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
  const contract = CrowdFunding.attach(contractAddress);
  
  // Get the first account (same as your MetaMask account)
  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);
  
  // Campaign details
  const title = "Test Campaign";
  const description = "This is a test campaign created directly";
  const target = ethers.utils.parseEther("1.0"); // 1 ETH
  const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  const image = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  
  try {
    const tx = await contract.createCampaign(
      owner.address,
      title,
      description,
      target,
      deadline,
      image
    );
    
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Campaign created successfully!");
    
    // Get all campaigns to verify
    const campaigns = await contract.getCampaigns();
    console.log("Total campaigns:", campaigns.length);
    console.log("Latest campaign:", {
      title: campaigns[campaigns.length - 1].title,
      target: ethers.utils.formatEther(campaigns[campaigns.length - 1].target),
      owner: campaigns[campaigns.length - 1].owner
    });
    
  } catch (error) {
    console.error("Failed to create campaign:", error);
  }
}

createCampaign()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });