import { ethers } from "hardhat";

async function main() {
  console.log("Deploying KnowledgeMarket implementation and TransparentProxy...");
  
  // Step 1: Deploy the KnowledgeMarket implementation
  console.log("1. Deploying KnowledgeMarket implementation...");
  const KnowledgeMarket = await ethers.getContractFactory("KnowledgeMarket");
  const implementation = await KnowledgeMarket.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  console.log(`   Implementation deployed at: ${implementationAddress}`);
  
  // Step 2: Deploy the TransparentProxy pointing to the implementation
  console.log("2. Deploying TransparentProxy...");
  const KnowledgeMarketProxy = await ethers.getContractFactory("KnowledgeMarketProxy");
  const proxy = await KnowledgeMarketProxy.deploy(implementationAddress);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(`   Proxy deployed at: ${proxyAddress}`);
  
  // Final instructions
  console.log("\nDeployment completed successfully!");
  console.log(`\nYou can interact with KnowledgeMarket through the proxy at: ${proxyAddress}`);
  console.log(`The actual implementation is at: ${implementationAddress}`);
  console.log("\nTo verify only the proxy (keeping implementation hidden):");
  console.log(`npx hardhat verify --network baseMainnet ${proxyAddress} ${implementationAddress}`);
  console.log("\nDon't verify the implementation to keep it obfuscated.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 