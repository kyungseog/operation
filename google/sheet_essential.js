"use strict";

const { google } = require("googleapis");
const util = require("../data-center/utility.js");
const keys = require("./data.json");
const { insertSql } = require("./insertSQL.js");

const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/spreadsheets",
]);
const spreadsheetId = util.lib.sheetIds.essentialSheetId;

client.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("GoogleSheet Connected!");
    const list = {
      product_essentials_products: "products!A2:L20000",
      product_essentials_variants: "variants!A2:J20000",
      product_essentials_sales: "sales!A2:G14907",
    };
    const keys = Object.keys(list);
    const values = Object.values(list);
    for (let i = 0; i < keys.length; i++) {
      updateData(client, keys[i], values[i]);
    }
  }
});

async function updateData(client, key, value) {
  const gsapi = google.sheets({ version: "v4", auth: client });
  const options = {
    spreadsheetId: spreadsheetId,
    range: value,
  };

  let datas = await gsapi.spreadsheets.values.get(options);
  let dataArray = datas.data.values;

  util.param.db.query(insertSql[key], [dataArray], function (error, result) {
    error ? console.log(error) : console.log(`update ${value} complete`);
  });
}
