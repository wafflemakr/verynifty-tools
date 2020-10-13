require("dotenv").config();

const Web3 = require("web3");
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);

const _ = require("lodash");
const { flow, partialRight: pr, keyBy, values } = _;
const lastUniqBy = (iteratee) => flow(pr(keyBy, iteratee), values);

const address = "0x57f0B53926dd62f2E26bc40B30140AbEA474DA94"; // vNFT contract address
const abi = require("./abis/vNFTAbi");
const instance = new web3.eth.Contract(abi, address);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CREATION_BLOCK = 11023280;
const ONE_DAY = 24 * 60 * 60;
const MIN_TIME = 6 * 60 * 60; // 6 hours
const BLOCK_TIME = 13;

const getItemTime = (id) => {
  switch (parseInt(id)) {
    case 1:
      return 259200;
    case 2:
      return 172800;
    case 3:
      return 345600;
    case 4:
      return 86400;
    case 5:
      return 604800;
    default:
      return 0;
  }
};

const start = async () => {
  console.log("Fetching past events...");

  const currentBlock = await web3.eth.getBlockNumber();
  const currentTime = Date.now() / 1000;

  const mintEvents = await instance.getPastEvents("Transfer", {
    filter: {
      from: ZERO_ADDRESS,
    },
    fromBlock: CREATION_BLOCK,
    toBlock: "latest",
  });

  let consumeEvents = await instance.getPastEvents("VnftConsumed", {
    fromBlock: CREATION_BLOCK,
    toBlock: "latest",
  });

  consumeEvents = consumeEvents.map((t) => {
    return {
      block: t.blockNumber,
      txHash: t.transactionHash,
      ...t.returnValues,
    };
  });

  consumeEvents = lastUniqBy("nftId")(consumeEvents);

  const deadIds = [];
  const soonIds = [];

  for (let i = 0; i < mintEvents.length - 1; i++) {
    const { tokenId } = mintEvents[i].returnValues;

    const consumed = consumeEvents.filter((t) => t.nftId == tokenId)[0];

    // If token has not consumed Items
    if (!consumed) {
      const mintTimeAprox =
        (currentBlock - mintEvents[i].blockNumber) * BLOCK_TIME;

      // if it was minted more than 3 days ago - time window
      if (mintTimeAprox > 3 * ONE_DAY) deadIds.push(tokenId);
    } else {
      const timeExtended = getItemTime(consumed.itemId);
      const aproxTimeAgo = (+currentBlock - consumed.block) * BLOCK_TIME;

      if (aproxTimeAgo > timeExtended) deadIds.push(tokenId);
      // This filters all other events, so we only query the blockchain
      // for the "suspicious" ones
      else if (aproxTimeAgo > timeExtended - MIN_TIME) {
        try {
          const {
            _level,
            _timeUntilStarving,
            _score,
            _expectedReward,
          } = await instance.methods.getVnftInfo(tokenId).call();
          console.log(
            `Token ${tokenId} dying soon! ${new Date(
              +_timeUntilStarving * 1000
            )} (${Math.floor(+_timeUntilStarving - currentTime)} sec)`
          );

          soonIds.push({
            tokenId,
            score: _score,
            level: _level,
            reward: _expectedReward,
            tod: _timeUntilStarving,
            timeLeft: +_timeUntilStarving - currentTime,
          });
        } catch (error) {
          console.log("Dead", tokenId);
        }
      }
    }
  }

  console.log("\n===Summary===\n");
  console.log("Total tokens minted:", mintEvents.length);
  console.log("Total items consumed:", consumeEvents.length);
  console.log("Total NFTs dying soon:", soonIds.length);
};

start();
