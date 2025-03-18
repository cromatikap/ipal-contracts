import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { KnowledgeMarket, MockERC721 } from "../../typechain-types";

describe("KnowledgeMarket", function () {
  let knowledgeMarket: KnowledgeMarket;
  let mockNft: MockERC721;
  let owner: SignerWithAddress;
  let vault: SignerWithAddress;
  let user: SignerWithAddress;

  const RESOURCE_ID = "resource123";
  const IMAGE_URL = "https://example.com/image.jpg";
  const PRICE = ethers.parseEther("0.1"); // 0.1 ETH
  const EXPIRATION_DURATION = 86400; // 1 day in seconds

  beforeEach(async function () {
    [owner, vault, user] = await ethers.getSigners();

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
      await knowledgeMarket.connect(vault).setSubscription(
        RESOURCE_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      const subscriptions = await knowledgeMarket.getVaultSubscriptions(vault.address);
      expect(subscriptions.length).to.equal(1);
      expect(subscriptions[0].resourceId).to.equal(RESOURCE_ID);
      expect(subscriptions[0].imageURL).to.equal(IMAGE_URL);
      expect(subscriptions[0].price).to.equal(PRICE);
      expect(subscriptions[0].expirationDuration).to.equal(EXPIRATION_DURATION);
    });

    it("Should allow deleting a subscription", async function () {
      // First set a subscription
      await knowledgeMarket.connect(vault).setSubscription(
        RESOURCE_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );

      // Then delete it
      await knowledgeMarket.connect(vault).deleteSubscription(RESOURCE_ID);

      const subscriptions = await knowledgeMarket.getVaultSubscriptions(vault.address);
      expect(subscriptions.length).to.equal(0);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      // Set up a subscription first
      await knowledgeMarket.connect(vault).setSubscription(
        RESOURCE_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );
    });

    it("Should allow minting with correct payment", async function () {
      await knowledgeMarket.connect(user).mint(
        vault.address,
        RESOURCE_ID,
        user.address,
        { value: PRICE }
      );

      const tokenId = await knowledgeMarket.totalSupply() - 1n;
      const deal = await knowledgeMarket.dealInfo(tokenId);
      expect(deal.vault).to.equal(vault.address);
      expect(deal.imageURL).to.equal(IMAGE_URL);
      expect(deal.price).to.equal(PRICE);
    });

    it("Should fail if payment amount is incorrect", async function () {
      const wrongPrice = PRICE - ethers.parseEther("0.01"); // Less than required price
      await expect(
        knowledgeMarket.connect(user).mint(
          vault.address,
          RESOURCE_ID,
          user.address,
          { value: wrongPrice }
        )
      ).to.be.revertedWithCustomError(knowledgeMarket, "InsufficientFunds");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      // Set up a subscription first
      await knowledgeMarket.connect(vault).setSubscription(
        RESOURCE_ID,
        PRICE,
        EXPIRATION_DURATION,
        IMAGE_URL
      );
    });

    it("Should grant access after minting", async function () {
      // User mints the access NFT
      await knowledgeMarket.connect(user).mint(
        vault.address,
        RESOURCE_ID,
        user.address,
        { value: PRICE }
      );

      // Check if the user has access to any of the vault's resources
      const hasGeneralAccess = await knowledgeMarket['hasAccess(address,address)'](vault.address, user.address);
      expect(hasGeneralAccess).to.be.true;
    });

    it("Should not grant access without minting", async function () {
      // Check access without minting
      const hasGeneralAccess = await knowledgeMarket['hasAccess(address,address)'](vault.address, user.address);
      expect(hasGeneralAccess).to.be.false;
    });

    it("Should verify access for specific resource", async function () {
      // User mints the access NFT
      await knowledgeMarket.connect(user).mint(
        vault.address,
        RESOURCE_ID,
        user.address,
        { value: PRICE }
      );

      // Check if the user has access to the specific resource
      const [hasSpecificAccess] = await knowledgeMarket['hasAccess(address,string,address)'](
        vault.address, 
        RESOURCE_ID, 
        user.address
      );
      expect(hasSpecificAccess).to.be.true;
    });
  });
}); 