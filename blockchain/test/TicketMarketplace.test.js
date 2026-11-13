import { expect } from "chai";
import hre from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

const { ethers } = hre;

describe("TicketMarketplace", function () {
  async function deployMarketplaceFixture() {
    const [admin, organizer, seller, buyer, thirdBuyer] =
      await ethers.getSigners();

    const EventTicket = await ethers.getContractFactory("EventTicket");
    const eventTicket = await EventTicket.deploy();

    const TicketMarketplace = await ethers.getContractFactory(
      "TicketMarketplace",
    );
    const ticketMarketplace = await TicketMarketplace.deploy(
      await eventTicket.getAddress(),
    );

    await eventTicket.setMarketplace(await ticketMarketplace.getAddress());

    const now = await time.latest();
    const startTime = now + 3600;
    const endTime = now + 86400;
    const saleStart = now - 60;
    const saleEnd = endTime - 600;

    await eventTicket.connect(organizer).createEvent(startTime, endTime);

    const originalPrice = ethers.parseEther("1.0");
    await eventTicket
      .connect(organizer)
      .addTicketTier(1n, originalPrice, 10n, saleStart, saleEnd);
    await eventTicket
      .connect(seller)
      .buyTicket(1n, 1n, 1n, { value: originalPrice });

    return {
      eventTicket,
      ticketMarketplace,
      admin,
      organizer,
      seller,
      buyer,
      thirdBuyer,
      originalPrice,
      endTime,
    };
  }

  it("Enforces 120% resale price cap based on immutable originalPrice", async function () {
    const { eventTicket, ticketMarketplace, seller, originalPrice } =
      await loadFixture(deployMarketplaceFixture);

    await eventTicket
      .connect(seller)
      .approve(await ticketMarketplace.getAddress(), 1n);

    // 1.21 ETH > 120% (1.20 ETH) => Revert
    const overCapPrice = ethers.parseEther("1.21");
    await expect(
      ticketMarketplace.connect(seller).listTicket(1n, overCapPrice),
    ).to.be.revertedWith("Price exceeds 120% resale cap");

    // Đúng bằng trần 1.20 ETH => Pass
    const maxAllowed = (originalPrice * 12000n) / 10000n;
    await expect(ticketMarketplace.connect(seller).listTicket(1n, maxAllowed))
      .to.emit(ticketMarketplace, "TicketListed")
      .withArgs(1n, 1n, seller.address, maxAllowed, maxAllowed);
  });

  it("Splits 5% royalty to organizer and 95% to seller, and preserves original cap on 2nd resale", async function () {
    const { eventTicket, ticketMarketplace, organizer, seller, buyer } =
      await loadFixture(deployMarketplaceFixture);

    const marketplaceAddress = await ticketMarketplace.getAddress();
    await eventTicket.connect(seller).approve(marketplaceAddress, 1n);

    const resalePrice = ethers.parseEther("1.2");
    await ticketMarketplace.connect(seller).listTicket(1n, resalePrice);

    const expectedRoyalty = (resalePrice * 500n) / 10000n; // 0.06 ETH
    const expectedSellerProceeds = resalePrice - expectedRoyalty; // 1.14 ETH

    const tx = await ticketMarketplace
      .connect(buyer)
      .buyResaleTicket(1n, { value: resalePrice });

    await expect(tx).to.changeEtherBalances(
      [buyer, seller, organizer],
      [-resalePrice, expectedSellerProceeds, expectedRoyalty],
    );
    await expect(tx)
      .to.emit(ticketMarketplace, "TicketResold")
      .withArgs(
        1n,
        1n,
        seller.address,
        buyer.address,
        resalePrice,
        expectedRoyalty,
      );

    expect(await eventTicket.ownerOf(1n)).to.equal(buyer.address);

    // Bán lại lần 2: trần giá vẫn tính 120% trên originalPrice (1.0 -> max 1.2), không phải 1.2 * 120%
    await eventTicket.connect(buyer).approve(marketplaceAddress, 1n);
    await expect(
      ticketMarketplace.connect(buyer).listTicket(1n, ethers.parseEther("1.3")),
    ).to.be.revertedWith("Price exceeds 120% resale cap");
  });

  it("Allows seller to cancel listing and blocks resale after check-in or event end", async function () {
    const {
      eventTicket,
      ticketMarketplace,
      organizer,
      seller,
      buyer,
      endTime,
    } = await loadFixture(deployMarketplaceFixture);

    await eventTicket
      .connect(seller)
      .approve(await ticketMarketplace.getAddress(), 1n);
    const resalePrice = ethers.parseEther("1.1");

    await ticketMarketplace.connect(seller).listTicket(1n, resalePrice);
    await expect(ticketMarketplace.connect(seller).cancelListing(1n))
      .to.emit(ticketMarketplace, "ListingCancelled")
      .withArgs(1n, seller.address);

    const listing = await ticketMarketplace.getListing(1n);
    expect(listing.active).to.equal(false);

    // Niêm yết lại rồi check-in -> người mua không thể mua lại vé đã dùng
    await ticketMarketplace.connect(seller).listTicket(1n, resalePrice);
    await eventTicket.connect(organizer).markTicketUsed(1n);

    await expect(
      ticketMarketplace
        .connect(buyer)
        .buyResaleTicket(1n, { value: resalePrice }),
    ).to.be.revertedWith("Ticket not eligible for resale");

    // Khi sự kiện hết hạn -> cũng không cho list vé mới
    await time.increaseTo(endTime + 1);
    await expect(
      ticketMarketplace.connect(seller).listTicket(1n, resalePrice),
    ).to.be.revertedWith("Ticket already listed");
  });
});
