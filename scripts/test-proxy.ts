import { ethers } from "hardhat";
import { 
  getProxyContract, 
  checkNameAndSymbol, 
  createSubscription, 
  verifySubscription,
  checkBalance,
  mintNft,
  verifyAccess,
  NETWORKS 
} from "./utils/proxy-test-utils";

async function main() {
  // Get hardhat's network name
  const hre = require("hardhat");
  const networkName = hre.network.name === "baseMainnet" ? "baseMainnet" : "baseSepolia";
  
  console.log(`Current network: ${networkName}`);
  const config = NETWORKS[networkName as keyof typeof NETWORKS];
  
  if (!config) {
    console.error(`Network "${networkName}" not supported. Available networks: ${Object.keys(NETWORKS).join(", ")}`);
    process.exit(1);
  }
  
  console.log(`=== COMPLETE PROXY TEST ON ${config.network.toUpperCase()} ===`);
  console.log(`Testing proxy address: ${config.proxyAddress}`);
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  console.log("----------------------------------------");
  
  // Get the KnowledgeMarket contract instance through the proxy
  const knowledgeMarket = await getProxyContract(config.proxyAddress);
  
  console.log("\n=== PART 1: SUBSCRIPTION TEST ===");
  
  // 1. Check name and symbol
  await checkNameAndSymbol(knowledgeMarket);
  
  // 2. Create a subscription
  const subscriptionTx = await createSubscription(
    knowledgeMarket,
    config.vaultId,
    config.price,
    config.expirationDuration,
    config.imageUrl
  );
  
  // 3. Verify the subscription was created
  const subscriptionVerified = await verifySubscription(knowledgeMarket, config.vaultId, deployer.address);
  
  console.log("\n=== PART 2: MINTING TEST ===");
  
  // 1. Check initial balance
  console.log("\nStep 1: Checking initial NFT balance");
  const initialBalance = await checkBalance(knowledgeMarket, deployer.address);
  
  // 2. Mint an NFT
  console.log("\nStep 2: Minting NFT");
  try {
    let price = config.price;
    
    // Try to get the subscription details to check price
    try {
      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(deployer.address);
      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions.find(s => s.vaultId === config.vaultId);
        
        if (subscription) {
          price = subscription.price;
        }
      }
    } catch (error: any) {
      console.log("Could not retrieve subscription details. Using configured price.");
    }
    
    console.log(`Using price: ${price} wei`);
    
    // Mint the NFT
    await mintNft(
      knowledgeMarket,
      deployer.address, // vault owner (same as deployer)
      config.vaultId,
      deployer.address, // to address (same as deployer)
      price
    );
  } catch (error: any) {
    console.error("Error in minting step:", error.message || error);
    console.log("Continuing with the rest of the test...");
  }
  
  // 3. Check final balance
  console.log("\nStep 3: Checking final NFT balance");
  const finalBalance = await checkBalance(knowledgeMarket, deployer.address);
  
  if (finalBalance > initialBalance) {
    console.log("\nNFT minting was successful! ✅");
    console.log("The proxy is working correctly for minting operations.");
  } else {
    console.log("\nBalance did not increase. This could be because:");
    console.log("- The minting operation failed");
    console.log("- The contract interfaces may have changed");
    console.log("- There might be a connectivity issue");
  }
  
  // 4. Verify access
  console.log("\nStep 4: Verifying access with the NFT");
  
  // General access check
  const hasGeneralAccess = await verifyAccess(
    knowledgeMarket,
    deployer.address, // vault owner
    deployer.address  // customer
  );
  
  // Specific vault access check
  if (hasGeneralAccess) {
    await verifyAccess(
      knowledgeMarket,
      deployer.address, // vault owner
      deployer.address, // customer
      config.vaultId   // specific vault
    );
  }
  
  console.log("\n=== COMPLETE PROXY TEST COMPLETED ===");
  console.log(`The test on ${config.network} completed with some operations potentially skipped due to contract interface differences.`);
  console.log("Check the output for details on which operations succeeded and which had errors.");
}

main().catch((error) => {
  console.error("Unhandled error in main test execution:", error);
  process.exitCode = 1;
}); 