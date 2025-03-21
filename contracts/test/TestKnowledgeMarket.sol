// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../core/KnowledgeMarket.sol";

/**
 * @title TestKnowledgeMarket
 * @dev Test version of KnowledgeMarket with an obfuscated name for testing deployment on mainnet
 * Functionally identical to KnowledgeMarket but with a hash-like name for the token
 */
contract TestKnowledgeMarket is KnowledgeMarket {
    constructor() KnowledgeMarket() {
        // Override the name and symbol from the parent constructor
        // Note: This is a pattern to simulate having a different contract name
        // In a real-world scenario, you might want to use a proxy pattern instead
    }

    // Returns a hash-like name for obfuscation purposes
    function name() public pure override returns (string memory) {
        return "Protocol0x7f9A2";
    }

    // Returns a hash-like symbol for obfuscation purposes
    function symbol() public pure override returns (string memory) {
        return "PRX7F9A2";
    }
} 