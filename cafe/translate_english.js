"use strict";

const util = require("../data-center/utility.js");
const { DateTime } = require("luxon");
const { Translate } = require("@google-cloud/translate").v2;

const rule = new util.lib.schedule.RecurrenceRule();
rule.dayOfWeek = [1, 2, 3, 4, 5];
rule.hour = 21;
rule.minute = 0;
util.lib.schedule.scheduleJob("jpSalesDay", rule, () => translateText());

async function translateText() {
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "en translation start");
  const projectId = "management-375509";
  const keyFilename = "../google/data.json";
  const translate = new Translate({ projectId, keyFilename });

  const token = await util.sqlData(`SELECT access_token FROM cmipdb.i_cafe24auth`);

  const headers = {
    Authorization: "Bearer " + token[token.length - 1].access_token,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": "2022-03-01",
  };

  let getTranslateData = await util.sqlData(`
    SELECT a.product_no, b.product_name, a.product_name, a.eng_product_name, 
      a.clearance_category_code, c.clearance_category_name_en
    FROM cmipdb.api_productdata_jp a 
      LEFT JOIN cmipdb.api_productdata b USING(product_no)
      LEFT JOIN cmipdb.i_cafe24clearancecategorycode c USING(clearance_category_code)
    WHERE b.product_name != a.product_name
      AND (a.eng_product_name = '' OR a.eng_product_name IS NULL) 
      AND a.clearance_category_code != '' AND a.clearance_category_code IS NOT NULL
    ORDER BY a.product_no DESC`);

  let targetTranslateText = [];

  for (let i = 0; i < getTranslateData.length; i++) {
    let [translations] = await translate.translate(getTranslateData[i].product_name, "en");
    translations = Array.isArray(translations) ? translations : [translations];
    let eng_product_name = translations + " " + getTranslateData[i].clearance_category_name_en;
    if (eng_product_name.length > 50) {
      eng_product_name = await checkDataLength(eng_product_name);
    }
    targetTranslateText.push([getTranslateData[i].product_no, eng_product_name]);
    await util.delayTime(500);
  }

  for (let i = 0; i < targetTranslateText.length; i++) {
    const payload = {
      shop_no: 2,
      request: {
        eng_product_name: targetTranslateText[i][1],
      },
    };
    const options = {
      method: "PUT",
      url: `https://moomooz.cafe24api.com/api/v2/admin/products/${targetTranslateText[i][0]}`,
      headers: headers,
      body: payload,
      json: true,
    };
    await util.requestData(options);
    await util.delayTime(500);
  }
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "en translation complete");
}

async function checkDataLength(data) {
  let cutData = await data.substring(data.indexOf(" ") + 1);
  if (cutData.length > 50) {
    return await checkDataLength(cutData);
  }
  return cutData;
}
