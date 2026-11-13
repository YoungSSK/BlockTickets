import { expect } from "chai";
import hre from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

const { ethers } = hre;

describe("EventTicket", function () {
  async function deployEventTicketFixture() {
    const [admin, organizer, buyer1, buyer2, stranger] =
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

    return {
      eventTicket,
      ticketMarketplace,
      admin,
      organizer,
      buyer1,
      buyer2,
      stranger,
      startTime,
      endTime,
      saleStart,
      saleEnd,
    };
  }

  it("Organizer creates event, adds tier, and buyer mints NFT tickets", async function () {
    const {
      eventTicket,
      organizer,
      buyer1,
      startTime,
      endTime,
      saleStart,
      saleEnd,
    } = await loadFixture(deployEventTicketFixture);

    await expect(eventTicket.connect(organizer).createEvent(startTime, endTime))
      .to.emit(eventTicket, "EventCreated")
      .withArgs(1n, organizer.address, startTime, endTime);

    const price = ethers.parseEther("0.1");
    await expect(
      eventTicket
        .connect(organizer)
        .addTicketTier(1n, price, 5n, saleStart, saleEnd),
    )
      .to.emit(eventTicket, "TicketTierAdded")
      .withArgs(1n, 1n, price, 5n, saleStart, saleEnd);

    const totalCost = price * 2n;
    const tx = await eventTicket
      .connect(buyer1)
      .buyTicket(1n, 1n, 2n, { value: totalCost });

    await expect(tx).to.changeEtherBalances(
      [buyer1, organizer],
      [-totalCost, totalCost],
    );
    await expect(tx)
      .to.emit(eventTicket, "TicketMinted")
      .withArgs(1n, 1n, 1n, buyer1.address, price);

    expect(await eventTicket.ownerOf(1n)).to.equal(buyer1.address);
    expect(await eventTicket.ownerOf(2n)).to.equal(buyer1.address);

    const tier = await eventTicket.getTicketTier(1n);
    expect(tier.currentSupply).to.equal(2n);
  });

  it("Reverts when non-organizer adds tier, wrong ETH sent, or exceeds maxSupply", async function () {
    const {
      eventTicket,
      organizer,
      buyer1,
      stranger,
      startTime,
      endTime,
      saleStart,
      saleEnd,
    } = await loadFixture(deployEventTicketFixture);

    await eventTicket.connect(organizer).createEvent(startTime, endTime);
    const price = ethers.parseEther("0.2");

    await expect(
      eventTicket
        .connect(stranger)
        .addTicketTier(1n, price, 2n, saleStart, saleEnd),
    ).to.be.revertedWith("Only event organizer");

    await eventTicket
      .connect(organizer)
      .addTicketTier(1n, price, 2n, saleStart, saleEnd);

    await expect(
      eventTicket
        .connect(buyer1)
        .buyTicket(1n, 1n, 1n, { value: ethers.parseEther("0.1") }),
    ).to.be.revertedWith("Incorrect ETH amount");

    await eventTicket
      .connect(buyer1)
      .buyTicket(1n, 1n, 2n, { value: price * 2n });

    await expect(
      eventTicket.connect(buyer1).buyTicket(1n, 1n, 1n, { value: price }),
    ).to.be.revertedWith("Exceeds max supply");
  });

  it("Allows organizer/verifier check-in once, blocks double check-in and direct transfers", async function () {
    const {
      eventTicket,
      organizer,
      buyer1,
      buyer2,
      stranger,
      startTime,
      endTime,
      saleStart,
      saleEnd,
    } = await loadFixture(deployEventTicketFixture);

    await eventTicket.connect(organizer).createEvent(startTime, endTime);
    const price = ethers.parseEther("0.1");
    await eventTicket
      .connect(organizer)
      .addTicketTier(1n, price, 10n, saleStart, saleEnd);
    await eventTicket.connect(buyer1).buyTicket(1n, 1n, 1n, { value: price });

    // Không cho chuyển vé trực tiếp ngoài TicketMarketplace
    await expect(
      eventTicket
        .connect(buyer1)
        .transferFrom(buyer1.address, buyer2.address, 1n),
    ).to.be.revertedWith("Transfers allowed only via TicketMarketplace");

    // Người lạ không được check-in
    await expect(
      eventTicket.connect(stranger).markTicketUsed(1n),
    ).to.be.revertedWith("Not authorized to check in");

    // Organizer check-in thành công lần 1
    await expect(eventTicket.connect(organizer).markTicketUsed(1n))
      .to.emit(eventTicket, "TicketUsed")
      .withArgs(1n, 1n, organizer.address);

    // Chặn check-in lần 2
    await expect(
      eventTicket.connect(organizer).markTicketUsed(1n),
    ).to.be.revertedWith("Ticket already used");

    expect(await eventTicket.isResaleAllowed(1n)).to.equal(false);
  });

  it("Blocks minting when event is cancelled or ended", async function () {
    const {
      eventTicket,
      organizer,
      buyer1,
      startTime,
      endTime,
      saleStart,
      saleEnd,
    } = await loadFixture(deployEventTicketFixture);

    await eventTicket.connect(organizer).createEvent(startTime, endTime);
    const price = ethers.parseEther("0.1");
    await eventTicket
      .connect(organizer)
      .addTicketTier(1n, price, 5n, saleStart, saleEnd);

    await expect(eventTicket.connect(organizer).cancelEvent(1n))
      .to.emit(eventTicket, "EventCancelled")
      .withArgs(1n);

    await expect(
      eventTicket.connect(buyer1).buyTicket(1n, 1n, 1n, { value: price }),
    ).to.be.revertedWith("Event is not active");
  });
});
