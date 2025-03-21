import { ethers } from "hardhat";
import { NETWORKS } from "./utils/proxy-test-utils";

async function main() {
  // Get the network from command line arguments
  const networkName = process.env.HARDHAT_NETWORK || "baseSepolia";
  
  console.log(`Deploying upgrade on ${networkName}...`);

  // Get the proxy address from the configuration
  // Using type assertion to avoid TypeScript errors
  const networkConfig = NETWORKS[networkName as keyof typeof NETWORKS];
  if (!networkConfig) {
    throw new Error(`No network configuration found for ${networkName}. Please check your proxy-test-utils.ts file.`);
  }
  
  const proxyAddress = networkConfig.proxyAddress;
  if (!proxyAddress) {
    throw new Error(`No proxy address found for network ${networkName}. Please deploy the proxy first.`);
  }

  console.log(`Proxy address: ${proxyAddress}`);

  // Deploy the new implementation contract
  console.log("Deploying the new implementation contract (KnowledgeMarketV2)...");
  const KnowledgeMarketV2 = await ethers.getContractFactory("KnowledgeMarketV2");
  const implementationV2 = await KnowledgeMarketV2.deploy();
  await implementationV2.waitForDeployment();
  const implementationV2Address = await implementationV2.getAddress();
  console.log(`KnowledgeMarketV2 implementation deployed at: ${implementationV2Address}`);

  // Connect to the KnowledgeMarketProxy contract
  console.log("Connecting to the KnowledgeMarketProxy contract...");
  const proxy = await ethers.getContractAt("KnowledgeMarketProxy", proxyAddress);
  
  // Get the current admin
  const adminAddress = await proxy.admin();
  console.log(`Current proxy admin: ${adminAddress}`);
  
  // Check if we're using the admin directly or through a ProxyAdmin contract
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  if (adminAddress.toLowerCase() === deployer.address.toLowerCase()) {
    // Direct admin mode - call upgradeTo directly
    console.log("Using direct admin mode (deployer is proxy admin)");
    await proxy.upgradeTo(implementationV2Address);
  } else {
    // ProxyAdmin mode - need to use the ProxyAdmin contract
    console.log("Using ProxyAdmin mode (ProxyAdmin contract is the proxy admin)");
    const proxyAdmin = await ethers.getContractAt("ProxyAdmin", adminAddress);
    await proxyAdmin.upgrade(proxyAddress, implementationV2Address);
  }
  
  console.log("Upgrade transaction confirmed");

  // Verify the new implementation
  try {
    // Try to get the implementation from the proxy (only admin can call this)
    const newImplementation = await proxy.implementation();
    console.log(`New implementation address: ${newImplementation}`);
    
    if (newImplementation.toLowerCase() === implementationV2Address.toLowerCase()) {
      console.log("✅ Upgrade successful!");
    } else {
      console.log("❌ Upgrade failed! Implementation address doesn't match.");
    }
  } catch (error) {
    console.log("Could not directly verify implementation (only admin can call this function)");
    console.log("Will test the contract to verify the upgrade...");
    
    // Create instance of the V2 interface pointing at the proxy address
    const upgradedContract = await ethers.getContractAt("KnowledgeMarketV2", proxyAddress);
    try {
      // Test the new version function
      const version = await upgradedContract.getVersion();
      console.log(`Contract version from new function: ${version}`);
      if (version === "2.0.0") {
        console.log("✅ Upgrade successful! New function 'getVersion()' is accessible.");
      } else {
        console.log("⚠️ Unexpected version returned. Check the implementation.");
      }
    } catch (error) {
      console.error("❌ Could not call the new function. Upgrade may have failed:", error);
    }
  }

  // Update the user about next steps
  console.log("\nUpgrade completed!");
  console.log("==============================================");
  console.log(`The proxy address remains: ${proxyAddress}`);
  console.log(`The new implementation is at: ${implementationV2Address}`);
  console.log("\nTo verify the new implementation on block explorer:");
  console.log(`npx hardhat verify --network ${networkName} ${implementationV2Address}`);
  console.log("\nNext step: Run the test-upgraded-contract.ts script to verify the upgrade functionality.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 