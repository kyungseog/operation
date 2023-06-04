"use strict";

const { google } = require("googleapis");
const util = require("../data-center/utility.js");
const keys = require("./data.json");
const { insertSql } = require("./insertSQL.js");

const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

client.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("GoogleSheet Connected!");
    updateEssentialData(client);
  }
});

async function updateEssentialData(client) {
  const gsapi = google.sheets({ version: "v4", auth: client });
  const options = {
    spreadsheetId: util.lib.sheetIds.essentialSheetId,
    range: "db_essential!A2:M9319",
  };

  let datas = await gsapi.spreadsheets.values.get(options);
  let dataArray = datas.data.values;

  util.param.db.query(insertSql.product_essentials, [dataArray], function (error, result) {
    error ? console.log(error) : console.log(`update essential data`);
  });
}
