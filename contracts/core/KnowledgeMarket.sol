// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4908} from "erc-4908/contracts/ERC4908.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract KnowledgeMarket is ERC4908, ReentrancyGuard {
    string DEFAULT_IMAGE_URL = "https://arweave.net/9u0cgTmkSM25PfQpGZ-JzspjOMf4uGFjkvOfKjgQnVY";

    struct Subscription {
        string resourceId;
        string imageURL;
    }

    struct Deal {
        address vault;
        string imageURL;
        uint256 price;
    }

    mapping(address => Subscription[]) public vaultSubscriptions;
    mapping(uint256 => Deal) public dealInfo;

    constructor() ERC4908("Knowledge Market Access", "KMA") {}

    function setSubscription(
        string calldata resourceId,
        uint256 price,
        uint32 expirationDuration,
        string calldata imageURL
    ) public {
        vaultSubscriptions[msg.sender].push(Subscription(resourceId, imageURL));
        setAccess(resourceId, price, expirationDuration);
    }

    function deleteSubscription(string calldata resourceId) public {
        Subscription[] storage subscriptions = vaultSubscriptions[msg.sender];
        uint256 length = subscriptions.length;

        for (uint256 i = 0; i < length; i++) {
            if (keccak256(abi.encodePacked(subscriptions[i].resourceId)) 
                    == keccak256(abi.encodePacked(resourceId))) {
                subscriptions[i] = subscriptions[length - 1];
                subscriptions.pop();
                break;
            }
        }

        delAccess(resourceId);
    }

    struct SubscriptionDetails {
        string resourceId;
        string imageURL;
        uint256 price;
        uint32 expirationDuration;
    }

    function getVaultSubscriptions(address vault) public view returns (SubscriptionDetails[] memory) {
        uint256 length = vaultSubscriptions[vault].length;
        SubscriptionDetails[] memory subs = new SubscriptionDetails[](length);

        for (uint256 i = 0; i < length; i++) {
            (uint256 price, uint32 expirationDuration) = this.getAccessControl(
                vault, 
                vaultSubscriptions[vault][i].resourceId
            );

            subs[i] = SubscriptionDetails(
                vaultSubscriptions[vault][i].resourceId,
                vaultSubscriptions[vault][i].imageURL,
                price,
                expirationDuration
            );
        }

        return subs;
    }

    function mint(
        address payable vault,
        string calldata resourceId,
        address to
    ) public payable override nonReentrant {
        super.mint(vault, resourceId, to);

        uint256 length = vaultSubscriptions[vault].length;
        string memory imageURL = "";
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(abi.encodePacked(vaultSubscriptions[vault][i].resourceId)) 
                    == keccak256(abi.encodePacked(resourceId))) {
                imageURL = vaultSubscriptions[vault][i].imageURL;
                break;
            }
        }

        dealInfo[totalSupply() - 1] = Deal(vault, imageURL, msg.value);
    }

    function hasAccess(
        address vault,
        address customer
    )
        public
        view
        returns (bool)
    {
        for (uint256 i = 0; i < vaultSubscriptions[vault].length; i++) {
            (bool response,,) = this.hasAccess(vault, vaultSubscriptions[vault][i].resourceId, customer);
            if (response) {
                return (response);
            }
        }
        return false;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        string memory jsonPreImage = string.concat(
            string.concat(
                string.concat('{"name": "', nftData[id].resourceId),
                '","description":"This NFT grants access to a knowledge vault.","external_url":"https://knowledge-market.io/vaults/","image":"'
            ),
            dealInfo[id].imageURL
        );

        string memory jsonPostImage = string.concat(
            '","attributes":[{"display_type": "date", "trait_type": "Expiration date","value": ', 
            Strings.toString(nftData[id].expirationTime)
        );
        string memory jsonPostTraits = '}]}';

        return string.concat(
            "data:application/json;utf8,",
            string.concat(
                string.concat(jsonPreImage, jsonPostImage),
                jsonPostTraits
            )
        );
    }
} 