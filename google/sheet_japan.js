'use strict'

const {google} = require('googleapis');
const util = require("../data-center/utility.js");

const koreaSheetId = util.lib.sheetIds.koreaSheetId;
const japanSheetId = util.lib.sheetIds.japanSheetId;
const marketingSheetId = util.lib.sheetIds.marketingSheetId;

const rateRange = 'rate!A2:C1000';
const customerRange = 'customer!A2:B1000';
const liveRange = 'live!A2:F1000';
const stockRange = 'stock!A2:L10000';
const colorCodeRange = 'color_code!A2:C1000';

const client = new google.auth.JWT(
  util.lib.keys.client_email,
  null, 
  util.lib.keys.private_key, 
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
      spreadsheetId: spreadsheetId,
      range: rateRange
  };
  let data = await gsapi.spreadsheets.values.get(readOption);
  let dataArray = data.data.values.map(function(r){
    return r[0];
  });
  let calculateMonth = paidCheckMonth;
  let dataTableName = 'a_mkrpartner'+ paidCheckYear + calculateMonth; //mariaDB의 월별 정산 데이터를 불러오기 위한 테이블 명칭
  let partnerCode = dataArray;

  partnerForLoop(dataTableName,partnerCode,calculateMonth,dataArray);

}
