const util = require("../data-center/utility.js");

const code = "x1sOqxW4B9Xj6oGbhHef9K"; //아래 url을 통해 얻게되는 code 값을 입력
const redirect_uri = "https://moomooz.co.kr";

const payload = `grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`;
const options = {
  method: "POST",
  url: "https://moomooz.cafe24api.com/api/v2/oauth/token",
  headers: {
    Authorization: `Basic ${util.param.cafe_auth_key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: payload,
  json: true,
};
const tokens = util.requestData(options);
tokens.then((values) => console.log(values));

// GET
// https://moomooz.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=REEcMPGRMlYgwx8YExdiSA&state=kskim&redirect_uri=https://moomooz.co.kr&scope=mall.read_category,mall.write_category,mall.read_product,mall.write_product,mall.read_collection,mall.write_collection,mall.read_supply,mall.write_supply,mall.read_personal,mall.write_personal,mall.read_order,mall.write_order,mall.read_community,mall.write_community,mall.read_customer,mall.write_customer,mall.read_notification,mall.write_notification,mall.read_store,mall.write_store,mall.read_promotion,mall.write_promotion,mall.read_design,mall.write_design,mall.read_salesreport,mall.read_privacy,mall.write_privacy,mall.read_mileage,mall.read_shipping,mall.write_shipping
// Base64 Encoding 방법
// let CAFE_ENCODE_ID = Buffer.from('CAFE_CLIENT_ID:CAFE_SERVICE_SECRET', "utf8").toString('base64')
