import { ethers } from "hardhat";
import { 
  getProxyContract, 
  checkNameAndSymbol, 
  createSubscription, 
  verifySubscription, 
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
  
  console.log(`Testing ObfuscatedProxy on ${config.network}...`);
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get the KnowledgeMarket contract instance through the proxy
  const knowledgeMarket = await getProxyContract(config.proxyAddress);
  
  // 1. Check name and symbol
  await checkNameAndSymbol(knowledgeMarket);
  
  // 2. Create a subscription
  await createSubscription(
    knowledgeMarket,
    config.vaultId,
    config.price,
    config.expirationDuration,
    config.imageUrl
  );
  
  // 3. Verify the subscription was created
  await verifySubscription(knowledgeMarket, config.vaultId, deployer.address);
  
  console.log(`\nProxy subscription test on ${config.network} completed!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 