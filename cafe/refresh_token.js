const util = require("../data-center/utility.js");

setInterval(() => {
  getRefreshToken();
}, 90 * 60 * 1000);

async function getRefreshToken() {
  const token = await util.db.query(`SELECT refresh_token FROM i_cafe24auth`);
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
  const refreshData = util.requestData(options);
  util.db.query("DELETE from i_cafe24auth");
  console.log("delete complete...");

  util.db.query(`
    INSERT INTO i_cafe24auth (issued_at, access_token, expires_at, refresh_token, refresh_token_expires_at) 
    VALUES ('${refreshData.issued_at}', '${refreshData.access_token}', '${refreshData.expires_at}', '${refreshData.refresh_token}', '${refreshData.refresh_token_expires_at}')
  `);
  console.log("update complete...");
}
