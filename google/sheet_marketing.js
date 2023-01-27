'use strict'

const { google } = require('googleapis');
const util = require("../data-center/utility.js");
const keys = require('./data.json');
const { insertSql } = require('./insertSQL.js');

const marketingSheetId = util.lib.sheetIds.marketingSheetId;

const metaRange = 'meta!A2:M100000';
const naverRange = 'naver!A2:L500000';
const kakaoRange = 'kakao!A2:F1000';
const googleRange = 'google!A2:L10000';
const metaJPRange = 'meta_jp!A2:M100000';

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
      spreadsheetId: marketingSheetId,
      range: metaRange
  };
  let data = await gsapi.spreadsheets.values.get(readOption);
  let dataArray = data.data.values.map(function(r){
    return [r[3], r[2], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[0], r[1]];
  });

  const dataSql = insertSql.marketing_meta;

  util.param.db.query(dataSql, [dataArray], function(error, result) {
    error? console.log(error): console.log('update marketing data');
  });
}
