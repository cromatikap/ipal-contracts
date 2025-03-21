import { ethers } from "hardhat";

async function main() {
  console.log("Deploying KnowledgeMarket contract...");
  
  // Get the contract factory
  const KnowledgeMarket = await ethers.getContractFactory("KnowledgeMarket");
  
  // Deploy the contract
  const knowledgeMarket = await KnowledgeMarket.deploy();
  
  // Wait for deployment to complete
  await knowledgeMarket.waitForDeployment();
  
  // Get the deployed address
  const knowledgeMarketAddress = await knowledgeMarket.getAddress();
  
  console.log(`KnowledgeMarket deployed to: ${knowledgeMarketAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 