import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { IPALToken } from "../../typechain-types";

describe("IPALToken", function () {
  let ipalToken: IPALToken;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let shareHolder: SignerWithAddress;
  let user: SignerWithAddress;

  const TOTAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const TREASURY_SHARE = TOTAL_SUPPLY * 70n / 100n; // 70%
  const SHAREHOLDERS_SHARE = TOTAL_SUPPLY * 25n / 100n; // 25%
  const AIRDROP_SHARE = TOTAL_SUPPLY * 5n / 100n; // 5%

  beforeEach(async function () {
    [owner, treasury, shareHolder, user] = await ethers.getSigners();
    
    const IPALToken = await ethers.getContractFactory("IPALToken");
    ipalToken = await IPALToken.deploy(treasury.address);
    await ipalToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ipalToken.owner()).to.equal(owner.address);
    });

    it("Should set the right treasury address", async function () {
      expect(await ipalToken.treasury()).to.equal(treasury.address);
    });

    it("Should have correct total supply", async function () {
      expect(await ipalToken.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("Should allocate correct initial shares", async function () {
      expect(await ipalToken.balanceOf(treasury.address)).to.equal(TREASURY_SHARE);
      expect(await ipalToken.unallocatedShareHolderTokens()).to.equal(SHAREHOLDERS_SHARE);
      expect(await ipalToken.unallocatedAirdropTokens()).to.equal(AIRDROP_SHARE);
    });
  });

  describe("Token Distribution", function () {
    it("Should allow owner to distribute shareholder tokens", async function () {
      await ipalToken.distributeShareHolderTokens(shareHolder.address, ethers.parseEther("1000"));
      expect(await ipalToken.balanceOf(shareHolder.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should fail if non-owner tries to distribute shareholder tokens", async function () {
      await expect(
        ipalToken.connect(user).distributeShareHolderTokens(shareHolder.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(ipalToken, "OwnableUnauthorizedAccount");
    });

    it("Should fail if trying to distribute more than available shareholder tokens", async function () {
      await expect(
        ipalToken.distributeShareHolderTokens(shareHolder.address, SHAREHOLDERS_SHARE + 1n)
      ).to.be.revertedWithCustomError(ipalToken, "InsufficientShareHolderTokens");
    });
  });

  describe("Airdrop", function () {
    it("Should allow owner to airdrop tokens", async function () {
      await ipalToken.airdrop(user.address, ethers.parseEther("100"));
      expect(await ipalToken.balanceOf(user.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if non-owner tries to airdrop tokens", async function () {
      await expect(
        ipalToken.connect(user).airdrop(user.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(ipalToken, "OwnableUnauthorizedAccount");
    });

    it("Should fail if trying to airdrop more than available airdrop tokens", async function () {
      await expect(
        ipalToken.airdrop(user.address, AIRDROP_SHARE + 1n)
      ).to.be.revertedWithCustomError(ipalToken, "InsufficientAirdropTokens");
    });
  });

  describe("Treasury", function () {
    it("Should not allow transferring treasury tokens without proper authorization", async function () {
      await expect(
        ipalToken.connect(user).transferFromTreasury(user.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(ipalToken, "OwnableUnauthorizedAccount");
    });
  });
}); 