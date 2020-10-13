const axios = require("axios");

module.exports = {
  coingecko: axios.create({
    baseURL: "https://api.coingecko.com/api/v3",
  }),
  gasStation: axios.create({
    baseURL: "https://ethgasstation.info/json/ethgasAPI.json",
  }),
};
