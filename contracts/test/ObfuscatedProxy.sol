// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ObfuscatedProxy
 * @dev A proxy contract that forwards calls to an implementation contract
 * This allows us to verify only this proxy contract, keeping the implementation unverified
 */
contract ObfuscatedProxy {
    // Address of the implementation contract
    address private immutable _implementation;
    
    // Owner of the proxy
    address private immutable _owner;
    
    // Custom name and symbol for obfuscation
    string private constant _NAME = "Protocol0x7f9A2";
    string private constant _SYMBOL = "PRX7F9A2";
    
    constructor(address implementation_) {
        require(implementation_ != address(0), "Implementation cannot be zero address");
        _implementation = implementation_;
        _owner = msg.sender;
    }
    
    // Allow receiving ETH
    receive() external payable {
        // Receive function doesn't have msg.data, so we pass empty bytes
        _delegateToImplementation(new bytes(0));
    }
    
    // Forward all calls to the implementation contract
    fallback() external payable {
        _delegateToImplementation(msg.data);
    }
    
    // Publicly accessible name function
    function name() external pure returns (string memory) {
        return _NAME;
    }
    
    // Publicly accessible symbol function
    function symbol() external pure returns (string memory) {
        return _SYMBOL;
    }
    
    // Returns the implementation address - onlyOwner to prevent casual discovery
    function implementation() external view returns (address) {
        require(msg.sender == _owner, "Only owner can view implementation");
        return _implementation;
    }
    
    // Internal function to delegate call to implementation
    function _delegateToImplementation(bytes memory callData) internal {
        // Get the implementation address outside of assembly
        address implementationContract = _implementation;
        
        // Execute delegatecall
        (bool success, bytes memory returndata) = implementationContract.delegatecall(callData);
        
        // Handle the result
        if (success) {
            assembly {
                return(add(returndata, 0x20), mload(returndata))
            }
        } else {
            assembly {
                revert(add(returndata, 0x20), mload(returndata))
            }
        }
    }
} 