'use strict'

const { google } = require('googleapis');
const util = require("../data-center/utility.js");
const keys = require('./data.json');
const { insertSql } = require('./insertSQL.js');

const koreaSheetId = util.lib.sheetIds.koreaSheetId;

const rateRange = 'rate!A2:C10000';
const supplierRange = 'supplier!A2:D10000';
const brandRange = 'brand!A2:I10000';
const customerRange = 'customer!A2:C500000';
const liveRange = 'live!A2:G10000';
const stockRange = 'stock!A2:L20000';

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
        updateKoreaData(client);
    }
});

async function updateKoreaData(client) {
  const updateName = ['rate','supplier','brand','customer','live','stock']
  const updateArray = [
    [rateRange, insertSql.exchange_rate],
    [supplierRange, insertSql.suppliers],
    [brandRange, insertSql.brands],
    [customerRange, insertSql.korea_users],
    [liveRange, insertSql.live_commerces],
    [stockRange, insertSql.stocks],
  ];

  const gsapi = google.sheets({version : 'v4', auth : client});

  for ( let i = 0; i < updateArray.length; i++ ) {
    const options = {
      spreadsheetId: koreaSheetId,
      range: updateArray[i][0]
    };
    let datas = await gsapi.spreadsheets.values.get(options);
    let dataArray = datas.data.values;

    const sql = updateArray[i][1];

    util.param.db.query(sql, [dataArray], function(error, result) {
      error ? console.log(error) : console.log(`update korea ${updateName[i]} data`);
    });
    await util.delayTime(1000);
  }
  console.log(`update complete`);
}
