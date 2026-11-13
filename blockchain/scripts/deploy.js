import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";

const { ethers, artifacts, network } = hre;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkInfo = await ethers.provider.getNetwork();
  const chainId = Number(networkInfo.chainId);

  console.log(`Deploying contracts to "${network.name}" (chainId: ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const EventTicket = await ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.deploy();
  await eventTicket.waitForDeployment();
  const eventTicketAddress = await eventTicket.getAddress();
  console.log(`EventTicket deployed at: ${eventTicketAddress}`);

  const TicketMarketplace = await ethers.getContractFactory(
    "TicketMarketplace",
  );
  const ticketMarketplace = await TicketMarketplace.deploy(eventTicketAddress);
  await ticketMarketplace.waitForDeployment();
  const marketplaceAddress = await ticketMarketplace.getAddress();
  console.log(`TicketMarketplace deployed at: ${marketplaceAddress}`);

  const setTx = await eventTicket.setMarketplace(marketplaceAddress);
  await setTx.wait();
  console.log(`EventTicket.setMarketplace tx: ${setTx.hash}`);

  const eventTicketArtifact = await artifacts.readArtifact("EventTicket");
  const marketplaceArtifact = await artifacts.readArtifact("TicketMarketplace");

  const deploymentMeta = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      EventTicket: eventTicketAddress,
      TicketMarketplace: marketplaceAddress,
    },
  };

  const eventTicketPayload = {
    address: eventTicketAddress,
    chainId,
    network: network.name,
    abi: eventTicketArtifact.abi,
  };

  const marketplacePayload = {
    address: marketplaceAddress,
    chainId,
    network: network.name,
    abi: marketplaceArtifact.abi,
  };

  const rootDir = path.resolve(__dirname, "../..");
  const backendContractsDir = path.join(
    rootDir,
    "backend/src/blockchain/contracts",
  );
  const frontendConstantsDir = path.join(rootDir, "frontend/src/constants");
  const frontendAbiDir = path.join(frontendConstantsDir, "abi");

  fs.mkdirSync(backendContractsDir, { recursive: true });
  fs.mkdirSync(frontendAbiDir, { recursive: true });

  // Xuất cho Backend (ESM có thể đọc JSON hoặc fs.readFileSync)
  fs.writeFileSync(
    path.join(backendContractsDir, "EventTicket.json"),
    JSON.stringify(eventTicketPayload, null, 2),
  );
  fs.writeFileSync(
    path.join(backendContractsDir, "TicketMarketplace.json"),
    JSON.stringify(marketplacePayload, null, 2),
  );
  fs.writeFileSync(
    path.join(backendContractsDir, "deployment.json"),
    JSON.stringify(deploymentMeta, null, 2),
  );

  // Xuất cho Frontend (Vite ESM hỗ trợ import JSON và ES module trực tiếp)
  fs.writeFileSync(
    path.join(frontendAbiDir, "EventTicket.json"),
    JSON.stringify(eventTicketArtifact.abi, null, 2),
  );
  fs.writeFileSync(
    path.join(frontendAbiDir, "TicketMarketplace.json"),
    JSON.stringify(marketplaceArtifact.abi, null, 2),
  );
  fs.writeFileSync(
    path.join(frontendConstantsDir, "contracts.js"),
    `export const CHAIN_ID = ${chainId};\n` +
      `export const NETWORK_NAME = "${network.name}";\n` +
      `export const EVENT_TICKET_ADDRESS = "${eventTicketAddress}";\n` +
      `export const TICKET_MARKETPLACE_ADDRESS = "${marketplaceAddress}";\n`,
  );

  console.log("Exported ABI & addresses to backend and frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
