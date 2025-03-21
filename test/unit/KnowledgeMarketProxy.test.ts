import { expect } from "chai";
import { ethers } from "hardhat";
import { KnowledgeMarket } from "../../typechain-types";
import { KnowledgeMarketProxy } from "../../typechain-types";
import { ProxyAdmin } from "../../typechain-types";

describe("KnowledgeMarketProxy", function () {
  let knowledgeMarket: KnowledgeMarket;
  let knowledgeMarketV2: KnowledgeMarket;
  let proxy: KnowledgeMarketProxy;
  let proxyAdmin: ProxyAdmin;
  let owner: any;
  let user: any;

  before(async function () {
    const [deployer, userAccount] = await ethers.getSigners();
    owner = deployer;
    user = userAccount;
  });

  beforeEach(async function () {
    // Deploy KnowledgeMarket implementation
    const KnowledgeMarket = await ethers.getContractFactory("KnowledgeMarket");
    knowledgeMarket = await KnowledgeMarket.deploy();
    await knowledgeMarket.waitForDeployment();
    const knowledgeMarketAddress = await knowledgeMarket.getAddress();

    // Deploy KnowledgeMarketProxy
    const KnowledgeMarketProxy = await ethers.getContractFactory("KnowledgeMarketProxy");
    proxy = await KnowledgeMarketProxy.deploy(knowledgeMarketAddress);
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();

    // Deploy ProxyAdmin
    const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.waitForDeployment();
    const proxyAdminAddress = await proxyAdmin.getAddress();

    // Transfer proxy admin to ProxyAdmin contract
    await proxy.changeAdmin(proxyAdminAddress);
  });

  it("Should return correct name and symbol", async function () {
    expect(await proxy.name()).to.equal("KnowledgeMarket");
    expect(await proxy.symbol()).to.equal("KNOW");
  });

  it("Should allow only admin to view implementation", async function () {
    // ProxyAdmin contract should be able to get implementation
    const implAddress = await proxyAdmin.getProxyImplementation(await proxy.getAddress());
    expect(implAddress).to.not.equal(ethers.ZeroAddress);

    // Direct call from user should revert
    await expect(proxy.connect(user).implementation()).to.be.revertedWith("Only admin can view implementation");
  });

  it("Should allow only ProxyAdmin to change admin", async function () {
    const newAdmin = user.address;
    
    // Attempt to call changeAdmin directly should fail
    await expect(proxy.connect(user).changeAdmin(newAdmin)).to.be.revertedWith("Only admin can change admin");
    
    // ProxyAdmin should be able to change admin
    await proxyAdmin.changeProxyAdmin(await proxy.getAddress(), newAdmin);
    
    // Now the admin should be changed
    const currentAdmin = await proxy.admin();
    expect(currentAdmin).to.equal(newAdmin);
  });

  it("Should allow upgrading to a new implementation", async function () {
    // Get the original implementation
    const originalImpl = await proxyAdmin.getProxyImplementation(await proxy.getAddress());
    
    // Deploy a second version of the implementation
    const KnowledgeMarketV2 = await ethers.getContractFactory("KnowledgeMarket");
    knowledgeMarketV2 = await KnowledgeMarketV2.deploy();
    await knowledgeMarketV2.waitForDeployment();
    const knowledgeMarketV2Address = await knowledgeMarketV2.getAddress();
    
    // Make sure it's different
    expect(knowledgeMarketV2Address).to.not.equal(originalImpl);
    
    // Upgrade through ProxyAdmin
    await proxyAdmin.upgrade(await proxy.getAddress(), knowledgeMarketV2Address);
    
    // Verify the implementation has been updated
    const newImpl = await proxyAdmin.getProxyImplementation(await proxy.getAddress());
    expect(newImpl).to.equal(knowledgeMarketV2Address);
  });

  it("Should forward calls to the implementation", async function () {
    // Create a KnowledgeMarket interface pointing to the proxy address
    const proxyAddress = await proxy.getAddress();
    const knowledgeMarketAtProxy = await ethers.getContractAt("KnowledgeMarket", proxyAddress);
    
    // Use a function from KnowledgeMarket through the proxy
    const vaultId = "test-vault";
    const price = ethers.parseEther("0.01");
    const expirationDuration = 60 * 60 * 24; // 1 day
    const imageURL = "https://example.com/image.jpg";
    
    // Call setSubscription via the proxy
    await knowledgeMarketAtProxy.setSubscription(vaultId, price, expirationDuration, imageURL);
    
    // Verify the subscription was set by reading from the proxy
    const subscriptions = await knowledgeMarketAtProxy.getVaultOwnerSubscriptions(owner.address);
    expect(subscriptions.length).to.be.greaterThan(0);
    expect(subscriptions[0].vaultId).to.equal(vaultId);
    expect(subscriptions[0].price).to.equal(price);
  });
}); 