require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const rawPrivateKey = process.env.PRIVATE_KEY
  ? process.env.PRIVATE_KEY.trim()
  : "";
const normalizedPrivateKey = rawPrivateKey
  ? rawPrivateKey.startsWith("0x")
    ? rawPrivateKey
    : `0x${rawPrivateKey}`
  : "";

const sepoliaAccounts =
  normalizedPrivateKey.length === 66 ? [normalizedPrivateKey] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: sepoliaAccounts,
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
