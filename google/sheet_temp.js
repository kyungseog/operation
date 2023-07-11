"use strict";

const { google } = require("googleapis");
const util = require("../data-center/utility.js");
const keys = require("./data.json");

const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

client.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("GoogleSheet Connected!");
    updateData(client);
  }
});

async function updateData(client) {
  const gsapi = google.sheets({ version: "v4", auth: client });
  const options = {
    spreadsheetId: "1I3gv-9YcOS_f_WaWV55B_d_Y-51jGNReSm7LD9VwFDU",
    range: "d2306!A2:E150000",
  };

  let datas = await gsapi.spreadsheets.values.get(options);
  let dataArray = datas.data.values;
  const dataQuery = `
    INSERT INTO management.korea_deliveries
      (sno
      , orderNo
      , scmNo
      , deliveryCharge
      , regDt) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      orderNo=values(orderNo)
      , scmNo=values(scmNo)
      , deliveryCharge=values(deliveryCharge)
      , regDt=values(regDt)`;

  util.param.db.query(dataQuery, [dataArray], function (error, result) {
    error ? console.log(error) : console.log(`update complete`);
  });
}
