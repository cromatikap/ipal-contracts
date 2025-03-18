![Ipal logo](https://i-p.rmcdn.net/65fd9abf114acc00326b972c/4693032/image-dbef989c-7504-46cf-97e1-410a19916f20.png?e=webp&nll=true)

# White paper (draft)

## NFT gated access

```mermaid
---
title: "Vault owners revenue flow"
---
graph TD
    Visitor -->|Sends Payment| KnowledgeMarket.sol
    KnowledgeMarket.sol -->|Transfers Payment| VaultOwner
    KnowledgeMarket.sol -->|Stores Deal Info| DealInfo

    subgraph "Knowledge Market contract"
        KnowledgeMarket.sol -->|Mint Subscription| MintFunction
        MintFunction -->|Updates| DealInfo
    end

    subgraph DealInfo
        DealInfo -->|Contains| VaultID
        DealInfo -->|Contains| ImageURL
        DealInfo -->|Contains| Price
    end
```

The `DealInfo` data structure in our system plays a critical role in enhancing both asset liquidity and the immutability of digital art or images. By storing key details like `VaultID`, `ImageURL`, and `Price` on the blockchain, we ensure that each deal's specifics are transparent and verifiable by any party at any time. This on-chain storage of deal information significantly boosts asset liquidity, as investors and users can easily assess the value and authenticity of an asset without needing intermediaries. Furthermore, the immutability of blockchain technology guarantees that once an image or piece of art is associated with a `DealInfo` entry, its link to the asset cannot be altered, providing a permanent record of ownership and authenticity. This feature not only protects creators by securing their work against unauthorized modifications but also instills confidence in buyers, fostering a more trustful and vibrant marketplace for digital assets.

## $IPAL token

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
