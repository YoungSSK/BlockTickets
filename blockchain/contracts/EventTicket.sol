// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IEventTicket} from "./interfaces/IEventTicket.sol";

contract EventTicket is ERC721, Ownable, ReentrancyGuard, IEventTicket {
    uint256 public constant MAX_MINT_PER_TX = 10;

    uint256 private _nextEventId = 1;
    uint256 private _nextTierId = 1;
    uint256 private _nextTokenId = 1;

    address public marketplace;

    mapping(uint256 => EventInfo) private _events;
    mapping(uint256 => TicketTier) private _tiers;
    mapping(uint256 => TicketInfo) private _tickets;
    mapping(address => bool) public isVerifier;

    event MarketplaceUpdated(address indexed marketplace);
    event VerifierUpdated(address indexed account, bool status);
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 startTime,
        uint256 endTime
    );
    event EventStatusUpdated(uint256 indexed eventId, bool isActive);
    event EventCancelled(uint256 indexed eventId);
    event TicketTierAdded(
        uint256 indexed tierId,
        uint256 indexed eventId,
        uint256 originalPrice,
        uint256 maxSupply,
        uint256 saleStartTime,
        uint256 saleEndTime
    );
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        uint256 indexed tierId,
        address buyer,
        uint256 originalPrice
    );
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address indexed checkedInBy);

    constructor() ERC721("BlockTickets NFT", "BTIX") Ownable(msg.sender) {}

    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace address");
        marketplace = _marketplace;
        emit MarketplaceUpdated(_marketplace);
    }

    function setVerifier(address account, bool status) external onlyOwner {
        require(account != address(0), "Invalid verifier address");
        isVerifier[account] = status;
        emit VerifierUpdated(account, status);
    }

    function createEvent(uint256 startTime, uint256 endTime) external returns (uint256) {
        require(endTime > startTime, "End time must be after start time");
        require(endTime > block.timestamp, "Event end time must be in the future");

        uint256 eventId = _nextEventId++;
        _events[eventId] = EventInfo({
            eventId: eventId,
            organizer: msg.sender,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            isCancelled: false,
            totalMinted: 0
        });

        emit EventCreated(eventId, msg.sender, startTime, endTime);
        return eventId;
    }

    function addTicketTier(
        uint256 eventId,
        uint256 originalPrice,
        uint256 maxSupply,
        uint256 saleStartTime,
        uint256 saleEndTime
    ) external returns (uint256) {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(ev.organizer == msg.sender, "Only event organizer");
        require(!ev.isCancelled, "Event is cancelled");
        require(originalPrice > 0, "Price must be greater than 0");
        require(maxSupply > 0, "Max supply must be greater than 0");
        require(saleEndTime > saleStartTime, "Invalid sale window");
        require(saleEndTime <= ev.endTime, "Sale must end before event ends");

        uint256 tierId = _nextTierId++;
        _tiers[tierId] = TicketTier({
            tierId: tierId,
            eventId: eventId,
            originalPrice: originalPrice,
            maxSupply: maxSupply,
            currentSupply: 0,
            saleStartTime: saleStartTime,
            saleEndTime: saleEndTime,
            exists: true
        });

        emit TicketTierAdded(
            tierId,
            eventId,
            originalPrice,
            maxSupply,
            saleStartTime,
            saleEndTime
        );
        return tierId;
    }

    function buyTicket(
        uint256 eventId,
        uint256 tierId,
        uint256 quantity
    ) external payable nonReentrant returns (uint256[] memory) {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(ev.isActive, "Event is not active");
        require(!ev.isCancelled, "Event is cancelled");
        require(block.timestamp < ev.endTime, "Event has ended");

        TicketTier storage tier = _tiers[tierId];
        require(tier.exists, "Ticket tier does not exist");
        require(tier.eventId == eventId, "Tier does not belong to event");
        require(
            block.timestamp >= tier.saleStartTime && block.timestamp <= tier.saleEndTime,
            "Ticket sale is not active"
        );
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid quantity");
        require(tier.currentSupply + quantity <= tier.maxSupply, "Exceeds max supply");

        uint256 totalCost = tier.originalPrice * quantity;
        require(msg.value == totalCost, "Incorrect ETH amount");

        tier.currentSupply += quantity;
        ev.totalMinted += quantity;

        uint256[] memory mintedIds = new uint256[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            _tickets[tokenId] = TicketInfo({
                tokenId: tokenId,
                eventId: eventId,
                tierId: tierId,
                originalPrice: tier.originalPrice,
                originalBuyer: msg.sender,
                isUsed: false
            });

            _safeMint(msg.sender, tokenId);
            mintedIds[i] = tokenId;

            emit TicketMinted(tokenId, eventId, tierId, msg.sender, tier.originalPrice);
        }

        (bool sent, ) = payable(ev.organizer).call{value: totalCost}("");
        require(sent, "Failed to transfer ETH to organizer");

        return mintedIds;
    }

    function markTicketUsed(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");

        TicketInfo storage ticket = _tickets[tokenId];
        EventInfo storage ev = _events[ticket.eventId];

        require(
            msg.sender == ev.organizer || msg.sender == owner() || isVerifier[msg.sender],
            "Not authorized to check in"
        );
        require(!ev.isCancelled, "Event is cancelled");
        require(!ticket.isUsed, "Ticket already used");

        ticket.isUsed = true;
        emit TicketUsed(tokenId, ticket.eventId, msg.sender);
    }

    function setEventStatus(uint256 eventId, bool isActive) external {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(msg.sender == ev.organizer || msg.sender == owner(), "Not authorized");
        require(!ev.isCancelled, "Event is cancelled");

        ev.isActive = isActive;
        emit EventStatusUpdated(eventId, isActive);
    }

    function cancelEvent(uint256 eventId) external {
        EventInfo storage ev = _events[eventId];
        require(ev.organizer != address(0), "Event does not exist");
        require(msg.sender == ev.organizer || msg.sender == owner(), "Not authorized");
        require(!ev.isCancelled, "Event already cancelled");

        ev.isCancelled = true;
        ev.isActive = false;
        emit EventCancelled(eventId);
    }

    function isResaleAllowed(uint256 tokenId) public view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) {
            return false;
        }
        TicketInfo storage ticket = _tickets[tokenId];
        EventInfo storage ev = _events[ticket.eventId];
        return !ticket.isUsed && !ev.isCancelled && block.timestamp < ev.endTime;
    }

    function getEventInfo(uint256 eventId) external view override returns (EventInfo memory) {
        require(_events[eventId].organizer != address(0), "Event does not exist");
        return _events[eventId];
    }

    function getTicketTier(uint256 tierId) external view override returns (TicketTier memory) {
        require(_tiers[tierId].exists, "Ticket tier does not exist");
        return _tiers[tierId];
    }

    function getTicketInfo(uint256 tokenId) external view override returns (TicketInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        return _tickets[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            TicketInfo storage ticket = _tickets[tokenId];
            EventInfo storage ev = _events[ticket.eventId];

            require(!ticket.isUsed, "Used ticket cannot be transferred");
            require(!ev.isCancelled, "Cancelled event ticket cannot be transferred");
            require(block.timestamp < ev.endTime, "Expired event ticket cannot be transferred");

            if (marketplace != address(0)) {
                require(msg.sender == marketplace, "Transfers allowed only via TicketMarketplace");
            }
        }

        return super._update(to, tokenId, auth);
    }
}