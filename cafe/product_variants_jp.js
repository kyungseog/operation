"use strict";

const { DateTime } = require("luxon");
const util = require("../data-center/utility.js");

const ruleJP = new util.lib.schedule.RecurrenceRule();
ruleJP.dayOfWeek = [1, 2, 3, 4, 5];
ruleJP.hour = [1, 7, 13, 19];
ruleJP.minute = 20;
util.lib.schedule.scheduleJob("firstGetData", ruleJP, () => firstGetData());

async function firstGetData() {
  const token = await util.sqlData(`SELECT access_token FROM cmipdb.i_cafe24auth`);
  const hearderData = {
    Authorization: "Bearer " + token[token.length - 1].access_token,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": "2022-06-01",
  };
  const productNoData = await util.sqlData(`
    SELECT product_no
    FROM cmipdb.api_productdata_jp
    WHERE display = 'T' AND selling = 'T'
    ORDER BY product_no DESC`);

  controlgetData(hearderData, productNoData);
}

async function controlgetData(hearderData, productNoData) {
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "jp variant update start", productNoData.length);

  let successCheck = [];

  for (let i = 0; i < productNoData.length; i++) {
    const isSuccess = await getVariantData(hearderData, productNoData[i].product_no);
    successCheck.length > 10 ? successCheck.shift() : successCheck.push(isSuccess);
    let checkCount = successCheck.filter((r) => r == "response error").length;

    if (checkCount > 5) {
      const reproductNoData = await util.sqlData(`
      SELECT product_no
      FROM cmipdb.api_productdata_jp
      WHERE display = 'T' AND selling = 'T' AND product_no < ${productNoData[i].product_no}
      ORDER BY product_no DESC`);

      console.log(
        DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"),
        "jp variant data restart: ",
        productNoData[i].product_no,
        reproductNoData.length
      );

      const accessToken = await util.sqlData(`SELECT access_token FROM i_cafe24auth`);
      const hearderData = {
        Authorization: "Bearer " + accessToken[0].access_token,
        "Content-Type": "application/json",
        "X-Cafe24-Api-Version": "2022-06-01",
      };
      controlgetData(hearderData, reproductNoData);
      break;
    }
    await util.delayTime(500);
  }
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "jp variant update complete");
}

async function getVariantData(hearderData, productNo) {
  const jpvariantOptions = {
    method: "GET",
    url: `https://moomooz.cafe24api.com/api/v2/admin/products/${productNo}/variants?shop_no=2`,
    headers: hearderData,
  };
  let jpres = JSON.parse(await util.requestData(jpvariantOptions));
  let jpvariantsArray = jpres.variants;
  await util.delayTime(500);

  const krVariantOptions = {
    method: "GET",
    url: `https://moomooz.cafe24api.com/api/v2/admin/products/${productNo}/variants`,
    headers: hearderData,
  };
  let krRes = JSON.parse(await util.requestData(krVariantOptions));
  let krVariantsArray = krRes.variants;

  if (jpvariantsArray == undefined || jpvariantsArray == null) {
    return "response error";
  } else {
    let insertArr = [];
    for (let i = 0; i < jpvariantsArray.length; i++) {
      let option_value_first = "",
        option_value_second = "";
      if (!(jpvariantsArray[i].options == undefined || jpvariantsArray[i].options == null)) {
        for (let j = 0; j < jpvariantsArray[i].options.length; j++) {
          j == 0
            ? (option_value_first = jpvariantsArray[i].options[0].value)
            : (option_value_second = jpvariantsArray[i].options[1].value);
        }
        if (
          !(krVariantsArray == undefined || krVariantsArray == null) &&
          jpvariantsArray[i].variant_code == krVariantsArray[i].variant_code
        ) {
          let data = [
            jpvariantsArray[i].variant_code,
            productNo,
            option_value_first,
            option_value_second,
            jpvariantsArray[i].custom_variant_code,
            jpvariantsArray[i].display,
            jpvariantsArray[i].selling,
            krVariantsArray[i].display,
            krVariantsArray[i].selling,
            parseInt(jpvariantsArray[i].quantity),
          ];
          insertArr.push(data);
        } else {
          let data = [
            jpvariantsArray[i].variant_code,
            productNo,
            option_value_first,
            option_value_second,
            jpvariantsArray[i].custom_variant_code,
            jpvariantsArray[i].display,
            jpvariantsArray[i].selling,
            null,
            null,
            parseInt(jpvariantsArray[i].quantity),
          ];
          insertArr.push(data);
        }
      }
    }
    if (insertArr.length !== 0) {
      const insertVariant = `INSERT INTO cmipdb.api_variantdata_jp 
        (variant_code, product_no, option_value_first, option_value_second, 
        custom_variant_code, display, selling, kr_display, kr_selling, quantity) 
        VALUES ? ON DUPLICATE KEY UPDATE 
        product_no=values(product_no), option_value_first=values(option_value_first), 
        option_value_second=values(option_value_second), 
        custom_variant_code=values(custom_variant_code), 
        display=values(display), selling=values(selling),
        kr_display=values(kr_display), kr_selling=values(kr_selling), 
        quantity=values(quantity)`;

      util.sqlData(insertVariant, [insertArr]);

      return "success";
    }
  }
}
