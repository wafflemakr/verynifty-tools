require("dotenv").config();

const _ = require("lodash");

const Web3 = require("web3");
const web3 = new Web3(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);

const address = "0x57f0B53926dd62f2E26bc40B30140AbEA474DA94"; // vNFT contract address
const abi = require("./abis/vNFTAbi");
const instance = new web3.eth.Contract(abi, address);

// PARAMS
const USER_ADDRESS = PASTE YOUR ADDRESS HERE;

const start = async () => {
  console.log("Fetching past events...");
  let events = await instance.getPastEvents("Transfer", {
    filter: {
      to: USER_ADDRESS,
    },
    fromBlock: 11023280,
    toBlock: "latest",
  });

  let tokens = events.map((e) => e.returnValues.tokenId);

  tokens = _.uniq(tokens);

  console.log("Total Tokens Owned:", tokens.length);

  for (let i = 0; i < tokens.length; i++) {
    const tokenId = tokens[i];

    let _level, _timeUntilStarving, _score, _lastTimeMined, _expectedReward;

    try {
      ({
        _level,
        _timeUntilStarving,
        _score,
        _lastTimeMined,
        _expectedReward,
      } = await instance.methods.getVnftInfo(tokenId).call());

      const currentTime = Date.now() / 1000;

      const timeRemaining = Math.floor(+_timeUntilStarving - currentTime);
      const timeToMine = Math.floor(
        +_lastTimeMined + 24 * 60 * 60 - currentTime
      );
      const mineTime =
        +_lastTimeMined + 24 * 60 * 60 < currentTime
          ? "NOOOOWWW!!"
          : new Date(
              (+_lastTimeMined + 24 * 60 * 60) * 1000
            ).toLocaleTimeString("en-US");
      const starvingTime =
        +_timeUntilStarving < currentTime
          ? "NOOOOWWW!!"
          : new Date(+_timeUntilStarving * 1000).toLocaleTimeString("en-US");

      console.log(
        `Token ${tokenId} (lvl ${_level}) \n\tScore: ${_score} \n\tRewards: ${Number(
          web3.utils.fromWei(_expectedReward)
        ).toFixed(2)} \n\tClaim time: ${mineTime} (${
          timeToMine < 0 ? 0 : timeToMine
        } sec) \n\tWill die at: ${starvingTime} (${
          timeRemaining < 0 ? 0 : timeRemaining
        } sec)`
      );
    } catch (error) {
      console.log(error.message)
    }
  }
};

start();
