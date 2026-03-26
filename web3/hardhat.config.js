require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337
    },
    ...(SEPOLIA_RPC_URL && PRIVATE_KEY ? {
      sepolia: {
        url: SEPOLIA_RPC_URL,
        accounts: [PRIVATE_KEY],
        chainId: 11155111
      }
    } : {})
  },
};
