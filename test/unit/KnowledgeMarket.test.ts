import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { KnowledgeMarket, MockERC721 } from "../../typechain-types";

describe("KnowledgeMarket", function () {
  let knowledgeMarket: KnowledgeMarket;
  let mockNft: MockERC721;
  let owner: SignerWithAddress;
  let vaultOwner: SignerWithAddress;
  let user: SignerWithAddress;
  let anotherUser: SignerWithAddress;

  const VAULT_ID = "vault123";
  const IMAGE_URL = "https://example.com/image.jpg";
  const PRICE = ethers.parseEther("0.1"); // 0.1 ETH
  const EXPIRATION_DURATION = 86400; // 1 day in seconds

  beforeEach(async function () {
    [owner, vaultOwner, user, anotherUser] = await ethers.getSigners();

    // Deploy mock NFT contract
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    mockNft = await MockERC721.deploy();
    await mockNft.waitForDeployment();

    // Deploy knowledge market contract
    const KnowledgeMarket = await ethers.getContractFactory("KnowledgeMarket");
    knowledgeMarket = await KnowledgeMarket.deploy();
    await knowledgeMarket.waitForDeployment();

    // Mint NFT to user
    await mockNft.mint(user.address, 1);
  });

  describe("Subscription Management", function () {
    it("Should allow setting a subscription", async function () {
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(vaultOwner.address);
      expect(subscriptions.length).to.equal(1);
      expect(subscriptions[0].vaultId).to.equal(VAULT_ID);
      expect(subscriptions[0].imageURL).to.equal(IMAGE_URL);
      expect(subscriptions[0].price).to.equal(PRICE);
      expect(subscriptions[0].expirationDuration).to.equal(EXPIRATION_DURATION);
    });

    it("Should allow deleting a subscription", async function () {
      // First set a subscription
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      // Then delete it
      await knowledgeMarket.connect(vaultOwner).deleteSubscription(VAULT_ID);

      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(vaultOwner.address);
      expect(subscriptions.length).to.equal(0);
    });

    it("Should use default image URL when none provided", async function () {
      // Set subscription with empty image URL
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        "" // Empty image URL
      );

      // Mint with this subscription
      await knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );

      const tokenId = await knowledgeMarket.totalSupply() - 1n;
      
      // Check tokenURI contains the default image
      const tokenURI = await knowledgeMarket.tokenURI(tokenId);
      expect(tokenURI).to.include("https://arweave.net/"); // Part of the DEFAULT_IMAGE_URL
    });

    it("Should emit SubscriptionCreated event", async function () {
      await expect(knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      ))
      .to.emit(knowledgeMarket, "SubscriptionCreated")
      .withArgs(vaultOwner.address, VAULT_ID, PRICE, EXPIRATION_DURATION);
    });

    it("Should emit SubscriptionDeleted event", async function () {
      // First set a subscription
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      // Then delete it and check for event
      await expect(knowledgeMarket.connect(vaultOwner).deleteSubscription(VAULT_ID))
        .to.emit(knowledgeMarket, "SubscriptionDeleted")
        .withArgs(vaultOwner.address, VAULT_ID);
    });

    it("Should reject empty vaultId", async function () {
      await expect(
        knowledgeMarket.connect(vaultOwner).setSubscription(
          "", // Empty vaultId
          PRICE,
          EXPIRATION_DURATION,
          IMAGE_URL
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "EmptyVaultId");
    });

    it("Should allow free NFTs with zero price", async function () {
      // Set subscription with zero price
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        "freeVault",
        0, // Zero price
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(vaultOwner.address);
      const freeSubscription = subscriptions.find(s => s.vaultId === "freeVault");
      expect(freeSubscription).to.not.be.undefined;
      expect(freeSubscription!.price).to.equal(0);
      
      // Test minting a free NFT
      await knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        "freeVault",
        user.address,
        { value: 0 }
      );
      
      // Check the user has access
      const [hasAccess] = await knowledgeMarket['hasAccess(address,string,address)'](
        vaultOwner.address, 
        "freeVault", 
        user.address
      );
      expect(hasAccess).to.be.true;
    });

    it("Should reject zero duration", async function () {
      await expect(
        knowledgeMarket.connect(vaultOwner).setSubscription(
          VAULT_ID,
          PRICE,
          0, // Zero duration
          IMAGE_URL
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "ZeroDuration");
    });

    it("Should reject empty vaultId when deleting", async function () {
      await expect(
        knowledgeMarket.connect(vaultOwner).deleteSubscription("")
      ).to.be.revertedWithCustomError(knowledgeMarket, "EmptyVaultId");
    });

    it("Should not do anything when deleting non-existent subscription", async function () {
      // Delete a subscription that doesn't exist
      await knowledgeMarket.connect(vaultOwner).deleteSubscription("nonexistent");
      
      // Verify no changes
      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(vaultOwner.address);
      expect(subscriptions.length).to.equal(0);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      // Set up a subscription first
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );
    });

    it("Should allow minting with correct payment", async function () {
      await knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );

      const tokenId = await knowledgeMarket.totalSupply() - 1n;
      const deal = await knowledgeMarket.dealInfo(tokenId);
      expect(deal.vaultOwner).to.equal(vaultOwner.address);
      expect(deal.imageURL).to.equal(IMAGE_URL);
      expect(deal.price).to.equal(PRICE);
    });

    it("Should fail if payment amount is incorrect", async function () {
      const wrongPrice = PRICE - ethers.parseEther("0.01"); // Less than required price
      await expect(
        knowledgeMarket.connect(user).mint(
          vaultOwner.address,
          VAULT_ID,
          user.address,
          { value: wrongPrice }
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "InsufficientFunds");
    });

    it("Should emit AccessGranted event", async function () {
      const tx = knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );

      const tokenId = await knowledgeMarket.totalSupply();
      
      await expect(tx)
        .to.emit(knowledgeMarket, "AccessGranted")
        .withArgs(vaultOwner.address, VAULT_ID, user.address, tokenId, PRICE);
    });

    it("Should fail with zero address for vaultOwner", async function () {
      await expect(
        knowledgeMarket.connect(user).mint(
          ethers.ZeroAddress,
          VAULT_ID,
          user.address,
          { value: PRICE }
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "ZeroAddress");
    });

    it("Should fail with zero address for receiver", async function () {
      await expect(
        knowledgeMarket.connect(user).mint(
          vaultOwner.address,
          VAULT_ID,
          ethers.ZeroAddress,
          { value: PRICE }
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "ZeroAddress");
    });

    it("Should fail with empty vaultId", async function () {
      await expect(
        knowledgeMarket.connect(user).mint(
          vaultOwner.address,
          "",
          user.address,
          { value: PRICE }
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "EmptyVaultId");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      // Set up a subscription first
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );
    });

    it("Should grant access after minting", async function () {
      // User mints the access NFT
      await knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );

      // Check if the user has access to any of the vault owner's resources
      const hasGeneralAccess = await knowledgeMarket['hasAccess(address,address)'](vaultOwner.address, user.address);
      expect(hasGeneralAccess).to.be.true;
    });

    it("Should not grant access without minting", async function () {
      // Check access without minting
      const hasGeneralAccess = await knowledgeMarket['hasAccess(address,address)'](vaultOwner.address, user.address);
      expect(hasGeneralAccess).to.be.false;
    });

    it("Should verify access for specific vault", async function () {
      // User mints the access NFT
      await knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );

      // Check if the user has access to the specific vault
      const [hasSpecificAccess] = await knowledgeMarket['hasAccess(address,string,address)'](
        vaultOwner.address, 
        VAULT_ID, 
        user.address
      );
      expect(hasSpecificAccess).to.be.true;
    });

    it("Should return false for zero addresses", async function () {
      // Check access with zero address for vaultOwner
      const hasGeneralAccess1 = await knowledgeMarket['hasAccess(address,address)'](
        ethers.ZeroAddress, 
        user.address
      );
      expect(hasGeneralAccess1).to.be.false;

      // Check access with zero address for customer
      const hasGeneralAccess2 = await knowledgeMarket['hasAccess(address,address)'](
        vaultOwner.address, 
        ethers.ZeroAddress
      );
      expect(hasGeneralAccess2).to.be.false;
    });
  });

  describe("TokenURI", function() {
    beforeEach(async function () {
      // Set up a subscription first
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      // Mint an NFT
      await knowledgeMarket.connect(user).mint(
        vaultOwner.address,
        VAULT_ID,
        user.address,
        { value: PRICE }
      );
    });

    it("Should return valid tokenURI with expected metadata", async function() {
      const tokenId = await knowledgeMarket.totalSupply() - 1n;
      const uri = await knowledgeMarket.tokenURI(tokenId);
      
      // Check that the URI contains expected fields
      expect(uri).to.include(VAULT_ID);
      expect(uri).to.include(IMAGE_URL);
      expect(uri).to.include("knowledge vault");
    });
  });

  describe("getVaultOwnerSubscriptions", function() {
    it("Should reject zero address", async function() {
      await expect(
        knowledgeMarket.getVaultOwnerSubscriptions(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(knowledgeMarket, "ZeroAddress");
    });

    it("Should return empty array for vault owner with no subscriptions", async function() {
      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(vaultOwner.address);
      expect(subscriptions.length).to.equal(0);
    });

    it("Should return multiple subscriptions when vault owner has many", async function() {
      // Add first subscription
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        VAULT_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );
      
      // Add second subscription
      await knowledgeMarket.connect(vaultOwner).setSubscription(
        "vault456",
        PRICE * 2n,
        EXPIRATION_DURATION * 2,
        "https://example.com/image2.jpg"
      );
      
      const subscriptions = await knowledgeMarket.getVaultOwnerSubscriptions(vaultOwner.address);
      expect(subscriptions.length).to.equal(2);
    });
  });
}); 