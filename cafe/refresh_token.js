const util = require("../data-center/utility.js");
const { google } = require("googleapis");
const keys = require("../google/data.json");

const rule = new util.lib.schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule.minute = 30;

util.lib.schedule.scheduleJob("refreshToken", rule, () => getRefreshToken());

async function getRefreshToken() {
  const token = await util.sqlData(`SELECT refresh_token FROM i_cafe24auth`);
  const refresh_token = token[0].refresh_token;

  let payload = `grant_type=refresh_token&refresh_token=${refresh_token}`;
  let options = {
    method: "POST",
    url: "https://moomooz.cafe24api.com/api/v2/oauth/token",
    headers: {
      Authorization: `Basic ${util.param.cafe_auth_key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
    json: true,
  };
  const refreshData = await util.requestData(options);
  util.sqlData("DELETE from i_cafe24auth");
  console.log("delete complete...");

  const refreshTokenDatas = [
    refreshData.issued_at,
    refreshData.access_token,
    refreshData.expires_at,
    refreshData.refresh_token,
    refreshData.refresh_token_expires_at,
  ];

  util.sqlData(
    `INSERT INTO i_cafe24auth (issued_at, access_token, expires_at, refresh_token, refresh_token_expires_at) VALUES (?)`,
    [refreshTokenDatas]
  );

  const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);

  client.authorize(async function (err, tokens) {
    if (err) return;
    console.log("GoogleSheet Connected!");
    const gsapi = google.sheets({ version: "v4", auth: client });
    const options = {
      spreadsheetId: util.lib.sheetIds.japanCheckSheetId,
      range: "info!A2:E2",
      valueInputOption: "USER_ENTERED",
      resource: { values: [refreshTokenDatas] },
    };
    await gsapi.spreadsheets.values.update(options);
  });
}
