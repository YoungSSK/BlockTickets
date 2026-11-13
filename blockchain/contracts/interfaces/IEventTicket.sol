// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEventTicket {
    struct EventInfo {
        uint256 eventId;
        address organizer;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isCancelled;
        uint256 totalMinted;
    }

    struct TicketTier {
        uint256 tierId;
        uint256 eventId;
        uint256 originalPrice;
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 saleStartTime;
        uint256 saleEndTime;
        bool exists;
    }

    struct TicketInfo {
        uint256 tokenId;
        uint256 eventId;
        uint256 tierId;
        uint256 originalPrice;
        address originalBuyer;
        bool isUsed;
    }

    function getEventInfo(uint256 eventId) external view returns (EventInfo memory);
    function getTicketTier(uint256 tierId) external view returns (TicketTier memory);
    function getTicketInfo(uint256 tokenId) external view returns (TicketInfo memory);
    function isResaleAllowed(uint256 tokenId) external view returns (bool);
}