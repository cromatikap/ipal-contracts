import { ethers } from "hardhat";
import { Contract, ContractTransactionResponse } from "ethers";
import { KnowledgeMarket } from "../../typechain-types";

/**
 * Configuration type for proxy testing
 */
interface ProxyTestConfig {
  proxyAddress: string;
  vaultId: string;
  price: bigint;
  expirationDuration: number; 
  imageUrl: string;
  network: string;
}

/**
 * Get the KnowledgeMarket contract instance through the proxy
 */
export async function getProxyContract(proxyAddress: string): Promise<KnowledgeMarket> {
  return await ethers.getContractAt("KnowledgeMarket", proxyAddress) as unknown as KnowledgeMarket;
}

/**
 * Check and log the name and symbol of the proxy
 */
export async function checkNameAndSymbol(proxyContract: KnowledgeMarket): Promise<void> {
  console.log("\nStep 1: Checking name and symbol");
  try {
    const name = await proxyContract.name();
    const symbol = await proxyContract.symbol();
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`The proxy should show "Protocol0x7f9A2" and "PRX7F9A2" rather than KnowledgeMarket names`);
  } catch (error: any) {
    console.error("Error getting name and symbol:", error.message || error);
    console.log("Continuing with the test...");
  }
}

/**
 * Create a subscription through the proxy
 */
export async function createSubscription(
  proxyContract: KnowledgeMarket,
  vaultId: string,
  price: bigint,
  expirationDuration: number,
  imageUrl: string
): Promise<ContractTransactionResponse | null> {
  console.log("\nStep 2: Creating a subscription");
  console.log(`Creating subscription with vaultId: ${vaultId}, price: ${price}`);
  
  try {
    const tx = await proxyContract.setSubscription(
      vaultId,
      price,
      expirationDuration,
      imageUrl
    );
    
    console.log("Transaction submitted. Waiting for confirmation...");
    await tx.wait();
    console.log("Subscription created successfully!");
    return tx;
  } catch (error: any) {
    console.error("Error creating subscription:", error.message || error);
    console.log("Continuing with the test...");
    return null;
  }
}

/**
 * Verify subscriptions through the proxy
 */
export async function verifySubscription(
  proxyContract: KnowledgeMarket,
  vaultId: string,
  ownerAddress: string
): Promise<boolean> {
  console.log("\nStep 3: Verifying subscription");
  
  try {
    const subscriptions = await proxyContract.getVaultOwnerSubscriptions(ownerAddress);
    
    if (subscriptions && subscriptions.length > 0) {
      console.log("Found subscriptions:");
      
      for (let i = 0; i < subscriptions.length; i++) {
        console.log(`Subscription ${i + 1}:`);
        console.log(`  VaultId: ${subscriptions[i].vaultId}`);
        console.log(`  Price: ${subscriptions[i].price} wei`);
        console.log(`  Expiration Duration: ${subscriptions[i].expirationDuration} seconds`);
        console.log(`  Image URL: ${subscriptions[i].imageURL}`);
      }
      
      // Find our specific subscription
      const ourSubscription = subscriptions.find((s) => s.vaultId === vaultId);
      
      if (ourSubscription) {
        console.log("\nOur test subscription was found! ✅");
        console.log("The proxy is working correctly, forwarding calls to the implementation contract.");
        return true;
      } else {
        console.log("\nCouldn't find our test subscription. ❌");
        return false;
      }
    } else {
      console.log("No subscriptions found. ❌");
      return false;
    }
  } catch (error: any) {
    console.error("Error verifying subscription:", error.message || error);
    console.log("This may be expected if the contract interface has changed. Continuing with the test...");
    return false;
  }
}

/**
 * Check NFT balance
 */
export async function checkBalance(proxyContract: KnowledgeMarket, address: string): Promise<bigint> {
  try {
    const balance = await proxyContract.balanceOf(address);
    console.log(`Balance: ${balance}`);
    return balance;
  } catch (error: any) {
    console.error("Error checking balance:", error.message || error);
    console.log("Continuing with the test and assuming balance is 0...");
    return BigInt(0);
  }
}

/**
 * Mint an NFT through the proxy
 */
export async function mintNft(
  proxyContract: KnowledgeMarket,
  vaultOwnerAddress: string,
  vaultId: string,
  toAddress: string,
  price: bigint
): Promise<ContractTransactionResponse | null> {
  console.log(`\nMinting NFT for vault ${vaultId} with price ${price} wei`);
  
  try {
    const tx = await proxyContract.mint(
      vaultOwnerAddress,
      vaultId,
      toAddress,
      { value: price }
    );
    
    console.log("Transaction submitted. Waiting for confirmation...");
    await tx.wait();
    console.log("NFT minted successfully!");
    return tx;
  } catch (error: any) {
    console.error("Error minting NFT:", error.message || error);
    console.log("Continuing with the test...");
    return null;
  }
}

/**
 * Verify access through the proxy
 */
export async function verifyAccess(
  proxyContract: KnowledgeMarket, 
  vaultOwnerAddress: string, 
  customerAddress: string,
  vaultId?: string
): Promise<boolean> {
  console.log("\nVerifying access with the NFT");
  
  try {
    let hasAccess: boolean;
    
    if (vaultId) {
      // Specific vault access check
      console.log(`Checking specific access for vault: ${vaultId}`);
      const [specificAccess] = await proxyContract['hasAccess(address,string,address)'](
        vaultOwnerAddress,
        vaultId,
        customerAddress
      );
      
      console.log(`Specific vault access: ${specificAccess ? "Granted ✅" : "Denied ❌"}`);
      hasAccess = specificAccess;
    } else {
      // General access check
      hasAccess = await proxyContract['hasAccess(address,address)'](
        vaultOwnerAddress,
        customerAddress
      );
      
      console.log(`General access status: ${hasAccess ? "Granted ✅" : "Denied ❌"}`);
    }
    
    if (hasAccess) {
      console.log("Access control is working correctly through the proxy.");
    } else {
      console.log("Access control verification failed.");
    }
    
    return hasAccess;
  } catch (error: any) {
    console.error("Error verifying access:", error.message || error);
    console.log("This may be expected if the contract interface has changed. Continuing with the test...");
    return false;
  }
}

/**
 * Network configurations
 */
export const NETWORKS = {
  baseMainnet: {
    proxyAddress: "0x848FedB4DD81E7A009B0ED4a7C2900Ea21721159",
    vaultId: "mainnet-test-vault-123",
    price: ethers.parseEther("0.001"),
    expirationDuration: 60 * 60 * 24 * 30, // 30 days
    imageUrl: "https://example.com/mainnet-test-image.jpg",
    network: "baseMainnet"
  },
  baseSepolia: {
    proxyAddress: "0x05889371937b66D9588C5C75be56CE0707bdFcf2",
    vaultId: "test-knowledge-vault-123",
    price: ethers.parseEther("0.001"),
    expirationDuration: 60 * 60 * 24 * 30, // 30 days
    imageUrl: "https://example.com/test-image.jpg",
    network: "baseSepolia"
  }
}; 