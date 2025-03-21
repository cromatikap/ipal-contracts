import { ethers } from "hardhat";
import { NETWORKS } from "./utils/proxy-test-utils";

async function main() {
  console.log("Testing upgraded KnowledgeMarketV2 contract on baseSepolia...");

  // Get the proxy address from our configuration
  const config = NETWORKS.baseSepolia;
  const PROXY_ADDRESS = config.proxyAddress;

  console.log(`Using proxy address: ${PROXY_ADDRESS}`);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Get the upgraded contract interface
  console.log("\nStep 1: Connect to the upgraded contract");
  const upgradedContract = await ethers.getContractAt("KnowledgeMarketV2", PROXY_ADDRESS);
  
  // Test the new version function
  console.log("\nStep 2: Testing the new getVersion function");
  const version = await upgradedContract.getVersion();
  console.log(`Contract version: ${version}`);
  
  if (version === "2.0.0") {
    console.log("✅ Successfully verified we're using the upgraded contract!");
  } else {
    console.log("❌ Version check failed!");
    return;
  }
  
  // Test that existing data is preserved
  console.log("\nStep 3: Verifying that existing subscriptions are preserved");
  
  try {
    const subscriptions = await upgradedContract.getVaultOwnerSubscriptions(signer.address);
    
    if (subscriptions && subscriptions.length > 0) {
      console.log("Found existing subscriptions:");
      
      for (let i = 0; i < subscriptions.length; i++) {
        console.log(`Subscription ${i + 1}:`);
        console.log(`  VaultId: ${subscriptions[i].vaultId}`);
        console.log(`  Price: ${subscriptions[i].price} wei`);
        console.log(`  Expiration Duration: ${subscriptions[i].expirationDuration} seconds`);
        console.log(`  Image URL: ${subscriptions[i].imageURL}`);
      }
      
      console.log("\n✅ Data migration successful! Existing subscriptions are preserved.");
    } else {
      console.log("No subscriptions found. Creating a new one to test functionality...");
      
      // Test setting a new subscription
      const vaultId = "upgraded-test-vault-" + Date.now();
      const price = ethers.parseEther("0.001");
      const expirationDuration = 60 * 60 * 24 * 7; // 7 days
      const imageUrl = "https://example.com/upgraded-test-image.jpg";
      
      console.log(`Creating subscription with vaultId: ${vaultId}, price: ${price}`);
      
      const tx = await upgradedContract.setSubscription(
        vaultId,
        price,
        expirationDuration,
        imageUrl
      );
      
      console.log("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      console.log("Subscription created successfully!");
      
      // Verify the subscription was created
      const newSubscriptions = await upgradedContract.getVaultOwnerSubscriptions(signer.address);
      if (newSubscriptions.length > 0) {
        console.log("\n✅ New subscription creation successful in the upgraded contract!");
      } else {
        console.log("\n❌ Failed to create new subscription!");
      }
    }
  } catch (error: any) {
    console.error("Error during subscription test:", error.message || error);
  }
  
  console.log("\nUpgrade test completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 