// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./KnowledgeMarketProxy.sol";

/**
 * @title ProxyAdmin
 * @dev This contract is the admin for proxies deployed using KnowledgeMarketProxy
 * Providing a separate admin contract makes admin operations more explicit
 */
contract ProxyAdmin {
    address private _owner;
    
    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _owner = msg.sender;
    }
    
    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == msg.sender, "ProxyAdmin: caller is not the owner");
        _;
    }
    
    /**
     * @dev Returns the current owner address.
     */
    function owner() external view returns (address) {
        return _owner;
    }
    
    /**
     * @dev Transfers ownership of the contract to a new account.
     * @param newOwner The address of the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ProxyAdmin: new owner is the zero address");
        _owner = newOwner;
    }
    
    /**
     * @dev Returns the current implementation of a proxy.
     * @param proxy Address of the proxy.
     * @return The address of the implementation.
     */
    function getProxyImplementation(KnowledgeMarketProxy proxy) external view returns (address) {
        // We use the implementation getter directly on the proxy (no need to be admin)
        return proxy.implementation();
    }
    
    /**
     * @dev Returns the admin of a proxy.
     * @param proxy Address of the proxy.
     * @return The address of the admin.
     */
    function getProxyAdmin(KnowledgeMarketProxy proxy) external view returns (address) {
        return proxy.admin();
    }
    
    /**
     * @dev Changes the admin of a proxy.
     * @param proxy Address of the proxy.
     * @param newAdmin Address of the new admin.
     */
    function changeProxyAdmin(KnowledgeMarketProxy proxy, address newAdmin) external onlyOwner {
        proxy.changeAdmin(newAdmin);
    }
    
    /**
     * @dev Upgrades a proxy to a new implementation.
     * @param proxy Address of the proxy.
     * @param implementation Address of the new implementation.
     */
    function upgrade(KnowledgeMarketProxy proxy, address implementation) external onlyOwner {
        proxy.upgradeTo(implementation);
    }
} 