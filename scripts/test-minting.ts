import { ethers } from "hardhat";
import { 
  getProxyContract, 
  checkBalance, 
  mintNft, 
  verifyAccess, 
  NETWORKS 
} from "./utils/proxy-test-utils";

async function main() {
  // Get the network from command line arguments or default to baseSepolia
  const networkName = process.argv[2] || "baseSepolia";
  const config = NETWORKS[networkName as keyof typeof NETWORKS];
  
  if (!config) {
    console.error(`Network "${networkName}" not supported. Available networks: ${Object.keys(NETWORKS).join(", ")}`);
    process.exit(1);
  }
  
  console.log(`Testing NFT minting through ObfuscatedProxy on ${config.network}...`);
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get the KnowledgeMarket contract instance through the proxy
  const knowledgeMarket = await getProxyContract(config.proxyAddress);
  
  // 1. Check initial balance
  console.log("\nStep 1: Checking initial NFT balance");
  const initialBalance = await checkBalance(knowledgeMarket, deployer.address);
  
  // 2. Mint an NFT
  console.log("\nStep 2: Minting NFT");
  try {
    // Get the subscription details to check price
    const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(deployer.address);
    const subscription = subscriptions.find(s => s.vaultId === config.vaultId);
    
    if (!subscription) {
      console.error(`Subscription with vault ID ${config.vaultId} not found!`);
      console.error(`Make sure to run the subscription test first with: npx hardhat run scripts/test-subscription.ts --network ${config.network}`);
      process.exit(1);
    }
    
    const price = subscription.price;
    
    // Mint the NFT
    await mintNft(
      knowledgeMarket,
      deployer.address, // vault owner (same as deployer)
      config.vaultId,
      deployer.address, // to address (same as deployer)
      price
    );
  } catch (error) {
    console.error("Error in minting step:", error);
    process.exit(1);
  }
  
  // 3. Check final balance
  console.log("\nStep 3: Checking final NFT balance");
  const finalBalance = await checkBalance(knowledgeMarket, deployer.address);
  
  if (finalBalance > initialBalance) {
    console.log("\nNFT minting was successful! ✅");
    console.log("The proxy is working correctly for minting operations.");
  } else {
    console.log("\nNFT minting failed. Balance did not increase. ❌");
    process.exit(1);
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
  
  console.log(`\nProxy minting test on ${config.network} completed!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 