// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InsufficientShareHolderTokens();
error InsufficientAirdropTokens();

contract IPALToken is ERC20, Ownable {
    address public immutable treasury;
    uint256 private _unallocatedShareHolderTokens;
    uint256 private _unallocatedAirdropTokens;

    constructor(address _treasury) ERC20("IPAL Token", "IPAL") Ownable(msg.sender) {
        require(_treasury != address(0), "Treasury address cannot be zero");
        treasury = _treasury;

        uint256 totalSupply = 1_000_000 * 10 ** decimals();
        
        // 70% to treasury
        uint256 treasuryShare = (totalSupply * 70) / 100;
        _mint(treasury, treasuryShare);
        
        // 25% for shareholders
        _unallocatedShareHolderTokens = (totalSupply * 25) / 100;
        _mint(address(this), _unallocatedShareHolderTokens);
        
        // 5% for airdrop
        _unallocatedAirdropTokens = (totalSupply * 5) / 100;
        _mint(address(this), _unallocatedAirdropTokens);
    }

    function unallocatedShareHolderTokens() public view returns (uint256) {
        return _unallocatedShareHolderTokens;
    }

    function unallocatedAirdropTokens() public view returns (uint256) {
        return _unallocatedAirdropTokens;
    }

    function distributeShareHolderTokens(address to, uint256 amount) public onlyOwner {
        if (amount > _unallocatedShareHolderTokens) {
            revert InsufficientShareHolderTokens();
        }
        _unallocatedShareHolderTokens -= amount;
        _transfer(address(this), to, amount);
    }

    function airdrop(address to, uint256 amount) public onlyOwner {
        if (amount > _unallocatedAirdropTokens) {
            revert InsufficientAirdropTokens();
        }
        _unallocatedAirdropTokens -= amount;
        _transfer(address(this), to, amount);
    }

    function transferFromTreasury(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot transfer to zero address");
        _transfer(treasury, to, amount);
    }
} 