import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TestKnowledgeMarket contract to Base mainnet...");
  
  // Get the contract factory
  const TestKnowledgeMarket = await ethers.getContractFactory("TestKnowledgeMarket");
  
  // Deploy the contract
  const testKnowledgeMarket = await TestKnowledgeMarket.deploy();
  
  // Wait for deployment to complete
  await testKnowledgeMarket.waitForDeployment();
  
  // Get the deployed address
  const testKnowledgeMarketAddress = await testKnowledgeMarket.getAddress();
  
  console.log(`TestKnowledgeMarket deployed to: ${testKnowledgeMarketAddress}`);
  console.log(`Verify with: npx hardhat verify --network baseMainnet ${testKnowledgeMarketAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 