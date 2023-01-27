'use strict'

const {google} = require('googleapis');
const util = require("../data-center/utility.js");
const keys = require('./data.json');
const { insertSql } = require('./insertSQL.js');

const koreaSheetId = util.lib.sheetIds.koreaSheetId;

const rateRange = 'rate!A2:C10000';
const supplierRange = 'supplier!A2:D10000';
const brandRange = 'brand!A2:H10000';
const customerRange = 'customer!A2:B500000';
const liveRange = 'live!A2:F10000';
const stockRange = 'stock!A2:L20000';
const colorCodeRange = 'color_code!A2:C500000';

const client = new google.auth.JWT(
  keys.client_email,
  null, 
  keys.private_key, 
  ['https://www.googleapis.com/auth/spreadsheets']
);

client.authorize(function(err, tokens){
    if(err) {
        console.log(err);
        return;
    } else {
        console.log('GoogleSheet Connected!');
        gsRead(client);
    }
});

async function gsRead(client) {
  const gsapi = google.sheets({version : 'v4', auth : client});
  const readOption = {
      spreadsheetId: koreaSheetId,
      range: rateRange
  };
  let data = await gsapi.spreadsheets.values.get(readOption);
  let dataArray = data.data.values;

  const dataSql = insertSql.korea_rate;

  util.param.db.query(dataSql, [dataArray], function(error, result) {
    error? console.log(error): console.log('update korea data');
  });
}
