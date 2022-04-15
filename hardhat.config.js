require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config()

const { ALCHEMY_API_KEY, MORALIS_API_KEY, DEPLOYER_MNEMONIC, ETHERSCAN_API_KEY, COIN_MARKET_CAP_KEY } = process.env;

module.exports = {
  solidity: "0.8.11",
  gasReporter: {
    enabled: true,
    currency: 'usd',
    gasPrice: 140,
    coinmarketcap: COIN_MARKET_CAP_KEY
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        // url: `https://speedy-nodes-nyc.moralis.io/${MORALIS_API_KEY}/eth/mainnet/archive`,
        blockNumber: 14528600,
        accounts: { mnemonic: DEPLOYER_MNEMONIC }
      }
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};




