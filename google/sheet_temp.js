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
    range: "data!A2:L50000",
  };

  let datas = await gsapi.spreadsheets.values.get(options);
  let dataArray = datas.data.values;
  const dataQuery = `
    INSERT INTO management.products
      (id
      , name
      , image
      , brand_id
      , custom_product_id
      , updated_at
      , seller_id
      , production_country
      , tax_type
      , fixed_price
      , product_price
      , cafe_product_code) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      name=values(name)
      , image=values(image)
      , brand_id=values(brand_id)
      , custom_product_id=values(custom_product_id)
      , updated_at=values(updated_at)
      , seller_id=values(seller_id)
      , production_country=values(production_country)
      , tax_type=values(tax_type)
      , fixed_price=values(fixed_price)
      , product_price=values(product_price)
      , cafe_product_code=values(cafe_product_code)`;

  util.param.db.query(dataQuery, [dataArray], function (error, result) {
    error ? console.log(error) : console.log(`update complete`);
  });
}
