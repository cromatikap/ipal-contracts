// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KnowledgeMarketProxy
 * @dev An upgradeable proxy contract that forwards calls to a KnowledgeMarket implementation
 * Based on OpenZeppelin's EIP-1967 proxy implementation pattern
 */
contract KnowledgeMarketProxy {
    // Storage slot with the address of the current implementation
    // This is the keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1
    bytes32 private constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    
    // Storage slot with the admin of the contract
    // This is the keccak-256 hash of "eip1967.proxy.admin" subtracted by 1
    bytes32 private constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    
    // Custom name and symbol for branding (can be changed in future implementations)
    string private constant _NAME = "KnowledgeMarket";
    string private constant _SYMBOL = "KNOW";
    
    /**
     * @dev Initializes the proxy with an implementation and admin
     * @param implementation_ Address of the initial implementation
     */
    constructor(address implementation_) {
        require(implementation_ != address(0), "Implementation cannot be zero address");
        
        // Set admin to msg.sender
        _setAdmin(msg.sender);
        
        // Set implementation
        _setImplementation(implementation_);
    }
    
    /**
     * @dev Allow receiving ETH
     */
    receive() external payable {
        _delegate(_getImplementation());
    }
    
    /**
     * @dev Forward all calls to the implementation contract
     */
    fallback() external payable {
        _delegate(_getImplementation());
    }
    
    /**
     * @dev Returns the current implementation address
     */
    function implementation() external view returns (address) {
        require(msg.sender == _getAdmin(), "Only admin can view implementation");
        return _getImplementation();
    }
    
    /**
     * @dev Returns the current admin address
     */
    function admin() external view returns (address) {
        return _getAdmin();
    }
    
    /**
     * @dev Changes the admin of the proxy
     * @param newAdmin Address of the new admin
     */
    function changeAdmin(address newAdmin) external {
        require(msg.sender == _getAdmin(), "Only admin can change admin");
        require(newAdmin != address(0), "New admin cannot be zero address");
        _setAdmin(newAdmin);
    }
    
    /**
     * @dev Upgrades the proxy to a new implementation
     * @param newImplementation Address of the new implementation
     */
    function upgradeTo(address newImplementation) external {
        require(msg.sender == _getAdmin(), "Only admin can upgrade");
        require(newImplementation != address(0), "New implementation cannot be zero address");
        _setImplementation(newImplementation);
    }
    
    /**
     * @dev Publicly accessible name function
     */
    function name() external pure returns (string memory) {
        return _NAME;
    }
    
    /**
     * @dev Publicly accessible symbol function
     */
    function symbol() external pure returns (string memory) {
        return _SYMBOL;
    }
    
    /**
     * @dev Returns the current implementation address
     */
    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }
    
    /**
     * @dev Sets the implementation address
     */
    function _setImplementation(address newImplementation) internal {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }
    
    /**
     * @dev Returns the current admin address
     */
    function _getAdmin() internal view returns (address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }
    
    /**
     * @dev Sets the admin address
     */
    function _setAdmin(address newAdmin) internal {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }
    
    /**
     * @dev Delegates execution to an implementation contract
     */
    function _delegate(address implementation_) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())
            
            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation_, 0, calldatasize(), 0, 0)
            
            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())
            
            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
} 