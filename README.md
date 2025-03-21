![Ipal logo](https://i-p.rmcdn.net/65fd9abf114acc00326b972c/4693032/image-dbef989c-7504-46cf-97e1-410a19916f20.png?e=webp&nll=true)

# IPAL: Decentralized Knowledge Market
## White Paper v1.0

## Abstract

[Ipal network](https://ipal.network) introduces a revolutionary decentralized marketplace for knowledge exchange using blockchain technology. This white paper outlines the technical architecture and tokenomics of the IPAL platform, focusing on the fully implemented NFT-gated access system and the upcoming $IPAL token ecosystem. The platform enables content creators to monetize their knowledge while providing consumers with verifiable, immutable access rights through a transparent and secure mechanism.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Technical Architecture](#technical-architecture)
3. [NFT-Gated Access System](#nft-gated-access-system)
4. [Smart Contract Implementation](#smart-contract-implementation)
5. [$IPAL Token (Draft)](#ipal-token-draft)
6. [Roadmap](#roadmap)
7. [Conclusion](#conclusion)

---

## Introduction

In the current digital economy, knowledge creation and sharing face multiple challenges: centralized platforms extracting excessive fees, lack of ownership verification, and payment inefficiencies. IPAL addresses these challenges by creating a decentralized marketplace where creators maintain control over their knowledge assets while consumers gain transparent, verifiable access rights.

The IPAL ecosystem consists of two main components:
- **KnowledgeMarket Contract**: A fully implemented smart contract that manages access NFTs for knowledge vaults
- **$IPAL Token**: An upcoming governance and utility token (currently in development)

---

## Technical Architecture

IPAL's architecture is built on Ethereum smart contracts implementing the ERC4908 standard, which extends ERC721 to include time-limited access controls. This architecture enables secure, transparent, and efficient knowledge exchange without intermediaries.

```mermaid
---
title: "IPAL System Architecture"
---
graph TD
    User[Content Consumer] -->|Purchase Access| KM[KnowledgeMarket.sol]
    Creator[Knowledge Creator] -->|List Knowledge Vault| KM
    KM -->|Mint Access NFT| User
    KM -->|Forward Payment| Creator
    KM -->|Store Access Data| BC[Blockchain]
    
    subgraph "Smart Contract Layer"
        KM
        ERC4908[ERC4908 Implementation]
        KM -->|Extends| ERC4908
        P[Proxy] -->|Delegates to| KM
    end
    
    subgraph "Frontend Layer"
        FE[IPAL Platform Interface]
        FE -->|Interact| P
    end
```

---

## NFT-Gated Access System

The core of IPAL's functionality is the NFT-gated access system, enabling knowledge creators to sell access to their content through time-limited NFTs. When a consumer purchases access, they receive an NFT representing their access rights to specific knowledge vaults.

### Vault Owner Revenue Flow

```mermaid
---
title: "Vault Owner Revenue Flow"
---
graph TD
    Visitor -->|Sends Payment| KnowledgeMarket.sol
    KnowledgeMarket.sol -->|Transfers Payment| VaultOwner
    KnowledgeMarket.sol -->|Stores Deal Info| DealInfo

    subgraph "Knowledge Market Contract"
        KnowledgeMarket.sol -->|Mint Subscription| MintFunction
        MintFunction -->|Updates| DealInfo
    end

    subgraph DealInfo
        DealInfo -->|Contains| VaultID
        DealInfo -->|Contains| ImageURL
        DealInfo -->|Contains| Price
    end
```

### DealInfo: On-Chain Access Records

The `DealInfo` data structure plays a critical role in IPAL's ecosystem. It stores key transaction details on the blockchain, including:

- **VaultID**: Unique identifier for the knowledge vault
- **ImageURL**: Visual representation of the vault content
- **Price**: Cost paid for access

By storing these details on-chain, IPAL ensures complete transparency and immutability of access transactions. This approach:

1. **Enhances Asset Liquidity**: Investors and users can easily verify the value and authenticity of access rights
2. **Guarantees Immutability**: Once recorded, access details cannot be altered
3. **Creates Trustless Verification**: Any party can independently verify access rights
4. **Protects Creators**: Provides permanent record of ownership and access grants

---

## Smart Contract Implementation

The KnowledgeMarket contract implements several key features:

### Subscription Management
Vault owners can:
- Create subscription offerings with custom pricing and duration
- Set free (zero price) access when appropriate
- Update or remove subscription offerings
- Customize visual representation of their content

### Access Control
The contract provides:
- Time-limited access to vaults based on NFT ownership
- Verification methods to check access rights
- Access expiration based on predefined durations

### NFT Representation
Each access NFT includes:
- On-chain metadata about the knowledge vault
- Visual representation of the content
- Expiration information
- Ownership verification

### Security Features
The contract implements multiple security measures:
- Reentrancy protection for all state-changing functions
- Input validation for all parameters
- Zero-address checking
- Custom error handling
- Event emission for important state changes

### Proxy Pattern Implementation
The IPAL platform utilizes a transparent upgradeable proxy pattern that:
- Provides a consistent interface for users
- Enables interaction with the KnowledgeMarket contract
- Maintains a standardized access point
- Supports future upgradability while preserving the same contract address
- Allows the team to fix potential bugs or add features without disruption to users

#### Transparent Proxy Architecture
The proxy architecture consists of three main components:
1. **KnowledgeMarket (Implementation)**: Contains the core business logic
2. **TransparentUpgradeableProxy**: Forwards calls to the implementation while keeping its address constant
3. **ProxyAdmin**: Manages proxy administration, including upgrades to new implementations

This architecture follows the EIP-1967 standard for proxy storage slots, ensuring compatibility with block explorers and wallet providers.

```mermaid
---
title: "Transparent Proxy Architecture"
---
graph TD
    User[User] -->|Interacts with| Proxy
    Proxy[TransparentUpgradeableProxy] -->|Delegates calls| Implementation[KnowledgeMarket Implementation]
    Admin[ProxyAdmin] -->|Manages| Proxy
    Admin -->|Can upgrade| Implementation
    
    subgraph "Storage Layer"
        Proxy -->|Reads/Writes| Storage[On-chain Storage]
    end
```

Benefits of this architecture:
- **Immutable User-Facing Address**: The proxy address remains constant, simplifying integrations
- **Seamless Upgrades**: Implementation can be upgraded without affecting user experience
- **Separation of Concerns**: Admin functions are isolated in a separate contract for security
- **Future-Proofing**: Allows for bug fixes and feature additions without redeployment

---

## $IPAL Token (Draft)

> Note: This section represents planned functionality that is currently under development.

The $IPAL token will serve as both a governance and utility token within the IPAL ecosystem. Token holders will be able to participate in platform governance, receive rewards, and access premium features.

### Tokenomics

```mermaid
---
title: Tokenomic Structure
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

### Token Distribution

```mermaid
pie showData
    title Stakeholders Distribution
    "Project treasury" : 70
    "Share holders" : 25
    "Users (airdrop)" : 5
```

The planned token distribution ensures a balanced ecosystem that rewards early contributors while maintaining sufficient project treasury for ongoing development and marketing efforts.

---

## Roadmap

IPAL's development roadmap includes:

1. **Q2 2023 (Completed)**
   - ERC4908 standard implementation
   - KnowledgeMarket contract development

2. **Q3 2023 (Completed)**
   - Smart contract security audits
   - KnowledgeMarket deployment

3. **Q4 2023 (Completed)**
   - Frontend application development
   - Initial creator onboarding

4. **Q1 2024 (Completed)**
   - Platform optimization
   - NFT marketplace integration
   - Implementation of proxy pattern

5. **Q2 2024 (Current)**
   - $IPAL token development
   - Governance model implementation

6. **Q3 2024 (Planned)**
   - Token launch
   - DAO establishment

---

## Conclusion

IPAL represents a significant advancement in decentralized knowledge exchange. Through its NFT-gated access system, IPAL creates a transparent, secure marketplace where knowledge creators can monetize their expertise and consumers can gain verified access to valuable content.

With the fully implemented KnowledgeMarket contract and the upcoming $IPAL token, IPAL is positioned to become a leading platform in the Web3 knowledge economy, fostering a community-driven ecosystem that rewards creators fairly while providing consumers with verifiable access rights.

---

## Contract Deployments

### Base Mainnet
- KnowledgeMarket Proxy: [0x848FedB4DD81E7A009B0ED4a7C2900Ea21721159](https://basescan.org/address/0x848FedB4DD81E7A009B0ED4a7C2900Ea21721159)

### Base Sepolia (Testnet)
- KnowledgeMarket Proxy: [0x05889371937b66D9588C5C75be56CE0707bdFcf2](https://sepolia.basescan.org/address/0x05889371937b66D9588C5C75be56CE0707bdFcf2)
- KnowledgeMarket Implementation: [0x3C2D8565971d9B25295E0C0F2adDd03418fa0cB8](https://sepolia.basescan.org/address/0x3C2D8565971d9B25295E0C0F2adDd03418fa0cB8)
- ProxyAdmin: [0xF71B73570eb55454d86952d95de72021348fE248](https://sepolia.basescan.org/address/0xF71B73570eb55454d86952d95de72021348fE248)

---

## Contact

For more information about IPAL, please visit our website or contact our team:

- Website: [https://ipal.network](https://ipal.network)
- X: [@ipalNetwork](https://x.com/ipalNetwork)
- Telegram: [private group](https://t.me/+wrJscoA5409iN2Yy)
