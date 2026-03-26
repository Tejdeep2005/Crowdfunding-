// Script to create custom campaigns - edit the details below
const { ethers } = require("hardhat");

async function createCustomCampaign() {
  // 🔧 EDIT THESE DETAILS FOR YOUR CAMPAIGN:
  const CAMPAIGN_TITLE = "Clean Water Initiative";
  const CAMPAIGN_DESCRIPTION = "Bringing clean drinking water to remote villages in developing countries.";
  const CAMPAIGN_TARGET = "7.5"; // ETH amount
  const CAMPAIGN_DAYS = 45; // Days from now
  const CAMPAIGN_IMAGE = "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  
  console.log("Creating custom campaign...");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
  const contract = CrowdFunding.attach(contractAddress);
  
  const [owner] = await ethers.getSigners();
  console.log("Campaign owner:", owner.address);
  
  const target = ethers.utils.parseEther(CAMPAIGN_TARGET);
  const deadline = Math.floor(Date.now() / 1000) + (CAMPAIGN_DAYS * 24 * 60 * 60);
  
  console.log("Campaign details:");
  console.log("- Title:", CAMPAIGN_TITLE);
  console.log("- Target:", CAMPAIGN_TARGET, "ETH");
  console.log("- Duration:", CAMPAIGN_DAYS, "days");
  
  try {
    const tx = await contract.createCampaign(
      owner.address,
      CAMPAIGN_TITLE,
      CAMPAIGN_DESCRIPTION,
      target,
      deadline,
      CAMPAIGN_IMAGE
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Custom campaign created successfully!");
    
    // Show total campaigns
    const campaigns = await contract.getCampaigns();
    console.log(`\n📊 Total campaigns now: ${campaigns.length}`);
    
  } catch (error) {
    console.error("Failed to create campaign:", error);
  }
}

createCustomCampaign()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });