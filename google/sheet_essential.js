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
    updateEssentialSalesData(client);
    updateEssentialProductionData(client);
  }
});

async function updateEssentialSalesData(client) {
  const gsapi = google.sheets({ version: "v4", auth: client });
  const options = {
    spreadsheetId: util.lib.sheetIds.essentialSheetId,
    range: "db_essential!A2:F9319",
  };

  let datas = await gsapi.spreadsheets.values.get(options);
  let dataArray = datas.data.values;

  util.param.db.query(insertSql.product_essentials_sales, [dataArray], function (error, result) {
    error ? console.log(error) : console.log(`update essential sales data`);
  });
}

async function updateEssentialProductionData(client) {
  const gsapi = google.sheets({ version: "v4", auth: client });
  const options = {
    spreadsheetId: util.lib.sheetIds.essentialSheetId,
    range: "production!A2:M20000",
  };

  let datas = await gsapi.spreadsheets.values.get(options);
  let dataArray = datas.data.values;

  util.param.db.query(insertSql.product_essentials_production, [dataArray], function (error, result) {
    error ? console.log(error) : console.log(`update essential production data`);
  });
}
