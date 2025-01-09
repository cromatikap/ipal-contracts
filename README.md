# [ipal.network](https://beta2.ipal.network) white paper (draft)

## Smart contracts &amp; tokenomics

```mermaid
---
title: Tokenomic
---
flowchart TD
    llc("Wyoming LLC") --"represent"--> otoco
    otoco(Otoco DAO contract) --"is owner"--> treasury.sol
    otoco --"mint"--> $IPAL.sol
    $IPAL.sol --"for"--> vesting.sol
    otoco --"is owner"--> vesting.sol
    vesting.sol --"transfer to"--> treasury.sol
    vesting.sol --"transfer to"--> stakeholders(stake holders)
```

```mermaid
pie showData
    title Stakeholders total distribution
    "Project treasury" : 70
    "Share holders" : 25
    "Users (airdrop)" : 5
```
