require("dotenv").config();

const Web3 = require("web3");

const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new HDWalletProvider(
  process.env.PRIVATE_KEY,
  `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
);
const web3 = new Web3(provider);

const address = "0x57f0B53926dd62f2E26bc40B30140AbEA474DA94"; // vNFT contract address
const abi = require("../abis/vNFTAbi");

const instance = new web3.eth.Contract(abi, address);

const { gasStation } = require("../utils/axios");

// PARAMETERS
const DEAD_ID = 72; // NFT id to kill
const TOKEN_ID = 579; // The token id that will receive 60% of the point of dead id
const GAS_PRICE_LIMIT = 150; // Max amount of gwei to pay
const GAS_LIMIT = 200000; // Gas amount to send with tx

const execute = async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    const user = accounts[0];

    const gasData = await gasStation.get();
    const fastGasPrice = gasData.data.fast / 10;

    console.log("Gas Price:", fastGasPrice);

    if (fastGasPrice >= GAS_PRICE_LIMIT) return;

    const reward = await instance.methods.getFatalityReward(DEAD_ID).call();

    console.log("Expected Reward:", String(reward));

    const tx = instance.methods.fatality(DEAD_ID, TOKEN_ID);
    const gas = await tx.estimateGas({ from: user });
    console.log("Gas Estimated: ", gas);

    const _tx = await tx.send({
      from: user,
      gas: GAS_LIMIT,
      gasPrice: fastGasPrice * 1e9,
    });

    console.log("Successful?", _tx.status);

    process.exit(0);
  } catch (error) {
    console.log(error.message);
  }
};

execute();
