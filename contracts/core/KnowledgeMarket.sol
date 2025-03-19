// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4908} from "erc-4908/contracts/ERC4908.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KnowledgeMarket
 * @dev Contract for managing knowledge subscriptions using ERC4908 token standard
 */
contract KnowledgeMarket is ERC4908, ReentrancyGuard {
    // Default image URL used when no image is provided
    string private constant DEFAULT_IMAGE_URL = "https://arweave.net/9u0cgTmkSM25PfQpGZ-JzspjOMf4uGFjkvOfKjgQnVY";

    struct Subscription {
        string resourceId;
        string imageURL;
    }

    struct Deal {
        address vault;
        string imageURL;
        uint256 price;
    }

    // Resource string cannot be empty
    error EmptyResourceId();
    // Zero address cannot be used for vault or recipient
    error ZeroAddress();
    // Price cannot be zero
    error ZeroPrice();
    // Duration cannot be zero
    error ZeroDuration();

    // Maps vault addresses to their subscription offerings
    mapping(address => Subscription[]) public vaultSubscriptions;
    // Maps NFT IDs to their deal information
    mapping(uint256 => Deal) public dealInfo;

    // Events for important state changes
    event SubscriptionCreated(address indexed vault, string resourceId, uint256 price, uint32 expirationDuration);
    event SubscriptionDeleted(address indexed vault, string resourceId);
    event AccessGranted(address indexed vault, string resourceId, address indexed customer, uint256 tokenId, uint256 price);

    constructor() ERC4908("Knowledge Market Access", "KMA") {}

    /**
     * @dev Creates a new subscription offering
     * @param resourceId Unique identifier for the knowledge resource
     * @param price Cost to mint an access NFT
     * @param expirationDuration How long access lasts (in seconds)
     * @param imageURL URL for the image representing this subscription
     */
    function setSubscription(
        string calldata resourceId,
        uint256 price,
        uint32 expirationDuration,
        string calldata imageURL
    ) public nonReentrant {
        // Input validation
        if (bytes(resourceId).length == 0) revert EmptyResourceId();
        if (price == 0) revert ZeroPrice();
        if (expirationDuration == 0) revert ZeroDuration();

        // Use the default image if none provided
        string memory finalImageURL = bytes(imageURL).length == 0 ? DEFAULT_IMAGE_URL : imageURL;
        
        vaultSubscriptions[msg.sender].push(Subscription(resourceId, finalImageURL));
        setAccess(resourceId, price, expirationDuration);

        emit SubscriptionCreated(msg.sender, resourceId, price, expirationDuration);
    }

    /**
     * @dev Deletes an existing subscription offering
     * @param resourceId Unique identifier for the knowledge resource to delete
     */
    function deleteSubscription(string calldata resourceId) public nonReentrant {
        if (bytes(resourceId).length == 0) revert EmptyResourceId();
        
        Subscription[] storage subscriptions = vaultSubscriptions[msg.sender];
        uint256 length = subscriptions.length;
        bool found = false;

        for (uint256 i = 0; i < length; i++) {
            if (keccak256(abi.encodePacked(subscriptions[i].resourceId)) 
                    == keccak256(abi.encodePacked(resourceId))) {
                // More gas efficient swap-and-pop
                subscriptions[i] = subscriptions[length - 1];
                subscriptions.pop();
                found = true;
                break;
            }
        }

        if (found) {
            delAccess(resourceId);
            emit SubscriptionDeleted(msg.sender, resourceId);
        }
    }

    struct SubscriptionDetails {
        string resourceId;
        string imageURL;
        uint256 price;
        uint32 expirationDuration;
    }

    /**
     * @dev Gets all subscription offerings for a vault
     * @param vault Address of the vault
     * @return Array of subscription details
     */
    function getVaultSubscriptions(address vault) public view returns (SubscriptionDetails[] memory) {
        if (vault == address(0)) revert ZeroAddress();
        
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

    /**
     * @dev Mints an access NFT for a specific resource
     * @param vault Address receiving the payment
     * @param resourceId Unique identifier for the knowledge resource
     * @param to Address receiving the access NFT
     */
    function mint(
        address payable vault,
        string calldata resourceId,
        address to
    ) public payable override nonReentrant {
        if (vault == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (bytes(resourceId).length == 0) revert EmptyResourceId();

        super.mint(vault, resourceId, to);

        // Find the matching subscription's image URL
        uint256 length = vaultSubscriptions[vault].length;
        string memory imageURL = DEFAULT_IMAGE_URL; // Default value if not found
        
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(abi.encodePacked(vaultSubscriptions[vault][i].resourceId)) 
                    == keccak256(abi.encodePacked(resourceId))) {
                imageURL = vaultSubscriptions[vault][i].imageURL;
                break;
            }
        }

        uint256 tokenId = totalSupply() - 1;
        dealInfo[tokenId] = Deal(vault, imageURL, msg.value);
        
        emit AccessGranted(vault, resourceId, to, tokenId, msg.value);
    }

    /**
     * @dev Checks if a customer has access to any of a vault's resources
     * @param vault Address of the vault
     * @param customer Address to check access for
     * @return True if customer has access to any resource
     */
    function hasAccess(
        address vault,
        address customer
    )
        public
        view
        returns (bool)
    {
        if (vault == address(0) || customer == address(0)) return false;
        
        uint256 length = vaultSubscriptions[vault].length;
        for (uint256 i = 0; i < length; i++) {
            (bool response,,) = this.hasAccess(vault, vaultSubscriptions[vault][i].resourceId, customer);
            if (response) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Returns the token URI for an NFT
     * @param id Token ID
     * @return JSON metadata as a string
     */
    function tokenURI(uint256 id) public view override returns (string memory) {
        string memory imageUrl = bytes(dealInfo[id].imageURL).length > 0 
            ? dealInfo[id].imageURL 
            : DEFAULT_IMAGE_URL;
            
        string memory jsonPreImage = string.concat(
            string.concat(
                string.concat('{"name": "', nftData[id].resourceId),
                '","description":"This NFT grants access to a knowledge vault.","external_url":"https://knowledge-market.io/vaults/","image":"'
            ),
            imageUrl
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