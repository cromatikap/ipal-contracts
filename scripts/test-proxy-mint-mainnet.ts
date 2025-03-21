import { ethers } from "hardhat";

async function main() {
  console.log("Testing NFT minting through ObfuscatedProxy on Base mainnet...");
  
  // Constants
  const PROXY_ADDRESS = "0x848FedB4DD81E7A009B0ED4a7C2900Ea21721159";
  const VAULT_ID = "mainnet-test-vault-123"; // Same vault ID as in the previous test
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get the KnowledgeMarket contract instance through the proxy
  const knowledgeMarket = await ethers.getContractAt("KnowledgeMarket", PROXY_ADDRESS);
  
  // 1. Check initial balance (should be 0 for this vault)
  console.log("\nStep 1: Checking initial NFT balance");
  let initialBalance;
  try {
    initialBalance = await knowledgeMarket.balanceOf(deployer.address);
    console.log(`Initial balance: ${initialBalance}`);
  } catch (error) {
    console.error("Error checking initial balance:", error);
    process.exit(1);
  }
  
  // 2. Mint an NFT for the deployer
  console.log("\nStep 2: Minting NFT");
  try {
    // First get the price of the subscription to pass as payment
    const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(deployer.address);
    const subscription = subscriptions.find(s => s.vaultId === VAULT_ID);
    
    if (!subscription) {
      console.error(`Subscription with vault ID ${VAULT_ID} not found!`);
      process.exit(1);
    }
    
    const price = subscription.price;
    console.log(`Minting NFT for vault ${VAULT_ID} with price ${price} wei`);
    
    // Mint the NFT for the deployer
    const tx = await knowledgeMarket.mint(
      deployer.address, // vault owner (same as deployer in this case)
      VAULT_ID,
      deployer.address, // to address (same as deployer in this case)
      { value: price } // sending the required price
    );
    
    console.log("Transaction submitted. Waiting for confirmation...");
    await tx.wait();
    console.log("NFT minted successfully!");
  } catch (error) {
    console.error("Error minting NFT:", error);
    process.exit(1);
  }
  
  // 3. Check final balance (should be 1 now)
  console.log("\nStep 3: Checking final NFT balance");
  try {
    const finalBalance = await knowledgeMarket.balanceOf(deployer.address);
    console.log(`Final balance: ${finalBalance}`);
    
    if (finalBalance > initialBalance) {
      console.log("\nNFT minting was successful! ✅");
      console.log("The proxy is working correctly for minting operations.");
    } else {
      console.log("\nNFT minting failed. Balance did not increase. ❌");
    }
  } catch (error) {
    console.error("Error checking final balance:", error);
    process.exit(1);
  }
  
  // 4. Verify access is granted with the NFT
  console.log("\nStep 4: Verifying access with the NFT");
  try {
    // Use the hasAccess function with correct signature
    const hasAccess = await knowledgeMarket['hasAccess(address,address)'](
      deployer.address, // vault owner
      deployer.address  // customer
    );
    
    console.log(`Access status: ${hasAccess ? "Granted ✅" : "Denied ❌"}`);
    
    if (hasAccess) {
      console.log("Access control is working correctly through the proxy.");
    } else {
      console.log("Access control verification failed.");
    }
    
    // Also check specific vault access if available
    try {
      const [specificAccess] = await knowledgeMarket['hasAccess(address,string,address)'](
        deployer.address, // vault owner
        VAULT_ID,
        deployer.address  // customer
      );
      
      console.log(`Specific vault access: ${specificAccess ? "Granted ✅" : "Denied ❌"}`);
    } catch (error) {
      console.log("Note: Could not check specific vault access. This is optional and doesn't affect the test result.");
    }
  } catch (error) {
    console.error("Error verifying access:", error);
    process.exit(1);
  }
  
  console.log("\nProxy minting test on mainnet completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 