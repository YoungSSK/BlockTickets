// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IEventTicket} from "./interfaces/IEventTicket.sol";

contract TicketMarketplace is Ownable, ReentrancyGuard {
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_RESALE_BPS = 12000; // 120% giá gốc
    uint256 public constant ROYALTY_BPS = 500;      // 5% phí bản quyền cho Organizer

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    IERC721 public immutable ticketContract;
    IEventTicket public immutable eventTicket;

    mapping(uint256 => Listing) private _listings;

    event TicketListed(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed seller,
        uint256 price,
        uint256 maxAllowedPrice
    );
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event TicketResold(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed seller,
        address buyer,
        uint256 price,
        uint256 royaltyFee
    );

    constructor(address _eventTicket) Ownable(msg.sender) {
        require(_eventTicket != address(0), "Invalid EventTicket address");
        ticketContract = IERC721(_eventTicket);
        eventTicket = IEventTicket(_eventTicket);
    }

    function getMaxAllowedPrice(uint256 originalPrice) public pure returns (uint256) {
        return (originalPrice * MAX_RESALE_BPS) / BPS_DENOMINATOR;
    }

    function listTicket(uint256 tokenId, uint256 resalePrice) external {
        require(ticketContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!_listings[tokenId].active, "Ticket already listed");
        require(resalePrice > 0, "Price must be greater than 0");
        require(eventTicket.isResaleAllowed(tokenId), "Ticket not eligible for resale");
        require(
            ticketContract.getApproved(tokenId) == address(this) ||
                ticketContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        IEventTicket.TicketInfo memory ticketInfo = eventTicket.getTicketInfo(tokenId);
        uint256 maxAllowed = getMaxAllowedPrice(ticketInfo.originalPrice);
        require(resalePrice <= maxAllowed, "Price exceeds 120% resale cap");

        _listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: resalePrice,
            active: true
        });

        emit TicketListed(tokenId, ticketInfo.eventId, msg.sender, resalePrice, maxAllowed);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = _listings[tokenId];
        require(listing.active, "Listing is not active");
        require(
            listing.seller == msg.sender || msg.sender == owner(),
            "Not authorized to cancel"
        );

        listing.active = false;
        emit ListingCancelled(tokenId, listing.seller);
    }

    function buyResaleTicket(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = _listings[tokenId];
        require(listing.active, "Ticket is not listed");
        require(msg.sender != listing.seller, "Seller cannot buy own ticket");
        require(msg.value == listing.price, "Incorrect ETH amount");
        require(ticketContract.ownerOf(tokenId) == listing.seller, "Seller no longer owns ticket");
        require(eventTicket.isResaleAllowed(tokenId), "Ticket not eligible for resale");

        IEventTicket.TicketInfo memory ticketInfo = eventTicket.getTicketInfo(tokenId);
        IEventTicket.EventInfo memory eventInfo = eventTicket.getEventInfo(ticketInfo.eventId);

        require(
            listing.price <= getMaxAllowedPrice(ticketInfo.originalPrice),
            "Price exceeds 120% resale cap"
        );

        uint256 royaltyFee = (listing.price * ROYALTY_BPS) / BPS_DENOMINATOR;
        uint256 sellerProceeds = listing.price - royaltyFee;

        _listings[tokenId].active = false;

        ticketContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

        if (royaltyFee > 0) {
            (bool royaltySent, ) = payable(eventInfo.organizer).call{value: royaltyFee}("");
            require(royaltySent, "Failed to transfer royalty");
        }

        (bool sellerSent, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(sellerSent, "Failed to pay seller");

        emit TicketResold(
            tokenId,
            ticketInfo.eventId,
            listing.seller,
            msg.sender,
            listing.price,
            royaltyFee
        );
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return _listings[tokenId];
    }
}