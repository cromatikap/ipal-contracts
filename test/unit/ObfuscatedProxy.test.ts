import { expect } from "chai";
import { ethers } from "hardhat";
import { KnowledgeMarket, ObfuscatedProxy } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ObfuscatedProxy", function() {
  let knowledgeMarket: KnowledgeMarket;
  let proxy: ObfuscatedProxy;
  let implementationAddress: string;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  
  const VAULT_ID = "test-vault-123";
  const PRICE = ethers.parseEther("0.01");
  const EXPIRATION_DURATION = 60 * 60 * 24 * 30; // 30 days
  const IMAGE_URL = "https://example.com/image.jpg";
  
  beforeEach(async function() {
    // Get signers
    [owner, user] = await ethers.getSigners();
    
    // Deploy KnowledgeMarket implementation
    const KnowledgeMarketFactory = await ethers.getContractFactory("KnowledgeMarket");
    knowledgeMarket = await KnowledgeMarketFactory.deploy();
    
    // Save the implementation address
    implementationAddress = await knowledgeMarket.getAddress();
    
    // Deploy ObfuscatedProxy
    const ObfuscatedProxyFactory = await ethers.getContractFactory("ObfuscatedProxy");
    proxy = await ObfuscatedProxyFactory.deploy(implementationAddress);
    
    // Create a proxy-wrapped instance of KnowledgeMarket
    const proxyAddress = await proxy.getAddress();
    const wrappedKnowledgeMarket = await ethers.getContractAt("KnowledgeMarket", proxyAddress);
    
    // For testing, we'll use the wrapped instance
    knowledgeMarket = wrappedKnowledgeMarket;
  });
  
  describe("Proxy functionality", function() {
    it("Should return obfuscated name and symbol", async function() {
      // These functions are intercepted by the proxy
      const name = await ethers.provider.call({
        to: await proxy.getAddress(),
        data: knowledgeMarket.interface.encodeFunctionData("name")
      });
      
      const symbol = await ethers.provider.call({
        to: await proxy.getAddress(),
        data: knowledgeMarket.interface.encodeFunctionData("symbol")
      });
      
      // Decode the results
      const decodedName = ethers.AbiCoder.defaultAbiCoder().decode(['string'], name)[0];
      const decodedSymbol = ethers.AbiCoder.defaultAbiCoder().decode(['string'], symbol)[0];
      
      expect(decodedName).to.equal("Protocol0x7f9A2");
      expect(decodedSymbol).to.equal("PRX7F9A2");
    });
    
    it("Should allow owner to get implementation address", async function() {
      const proxyImplAddress = await proxy.implementation();
      expect(proxyImplAddress).to.equal(implementationAddress);
    });
    
    it("Should not allow non-owner to get implementation address", async function() {
      await expect(proxy.connect(user).implementation()).to.be.revertedWith("Only owner can view implementation");
    });
  });
  
  describe("Delegated functionality", function() {
    it("Should set subscription through proxy", async function() {
      // Set subscription using the proxied contract
      await knowledgeMarket.setSubscription(VAULT_ID, PRICE, EXPIRATION_DURATION, IMAGE_URL);
      
      // Check if subscription was set correctly
      const subs = await knowledgeMarket.getVaultOwnerSubscriptions(owner.address);
      expect(subs.length).to.equal(1);
      expect(subs[0].vaultId).to.equal(VAULT_ID);
      expect(subs[0].price).to.equal(PRICE);
    });
    
    it("Should mint NFT through proxy", async function() {
      // Set subscription
      await knowledgeMarket.setSubscription(VAULT_ID, PRICE, EXPIRATION_DURATION, IMAGE_URL);
      
      // Mint NFT using the proxied contract
      await knowledgeMarket.connect(user).mint(
        owner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );
      
      // Check NFT ownership
      expect(await knowledgeMarket.balanceOf(user.address)).to.equal(1);
      
      // Check access using the function overload that takes two addresses
      const hasAccess = await knowledgeMarket["hasAccess(address,address)"](owner.address, user.address);
      expect(hasAccess).to.be.true;
    });
  });
}); 