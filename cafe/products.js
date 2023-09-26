"use strict";

const util = require("../data-center/utility.js");
const { google } = require("googleapis");
const keys = require("../google/data.json");

const ruleKR = new util.lib.schedule.RecurrenceRule();
ruleKR.dayOfWeek = [1, 2, 3, 4, 5, 6];
ruleKR.minute = 20;
util.lib.schedule.scheduleJob("productsKR", ruleKR, () => updateProductKR());

const ruleJP = new util.lib.schedule.RecurrenceRule();
ruleJP.dayOfWeek = [1, 2, 3, 4, 5, 6];
ruleJP.minute = 50;
util.lib.schedule.scheduleJob("productsJP", ruleJP, () => updateProductJP());

async function updateProductKR() {
  const token = await util.sqlData(`SELECT access_token FROM cmipdb.i_cafe24auth`);
  const setHeaders = {
    Authorization: "Bearer " + token[token.length - 1].access_token,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": "2022-06-01",
  };

  const countOptions = {
    method: "GET",
    url: `https://moomooz.cafe24api.com/api/v2/admin/products/count`,
    headers: setHeaders,
  };

  const resCountData = JSON.parse(await util.requestData(countOptions));
  const latestProductNo = resCountData.count + 100000;

  const fieldData =
    "product_no,product_code,custom_product_code,product_name,supply_product_name,price,display,selling,tax_type,list_image,manufacturer_code,trend_code,brand_code,supplier_code,created_date,updated_date";
  console.log("kr product data update start");

  for (let i = 0; 100 * i < latestProductNo; i++) {
    const productOptions = {
      method: "GET",
      url: `https://moomooz.cafe24api.com/api/v2/admin/products?since_product_no=${
        100 * i
      }&fields=${fieldData}&limit=100`,
      headers: setHeaders,
    };
    const resProductData = JSON.parse(await util.requestData(productOptions));
    const productsArray = resProductData.products;

    if (productsArray != undefined) {
      const productDataArray = productsArray.map((u) => [
        u.product_no,
        u.product_code,
        u.custom_product_code,
        u.product_name,
        u.supply_product_name,
        u.price,
        u.display,
        u.selling,
        u.tax_type,
        u.list_image,
        u.manufacturer_code,
        u.trend_code,
        u.brand_code,
        u.supplier_code,
        new Date(Date.parse(u.created_date)),
        new Date(Date.parse(u.updated_date)),
      ]);

      const productDataSql = `INSERT INTO cmipdb.api_productdata (product_no,product_code,custom_product_code,
        product_name,supply_product_name,price,display,selling,
        tax_type,list_image,manufacturer_code,trend_code,brand_code,supplier_code,created_date,updated_date) 
      VALUES ? ON DUPLICATE KEY UPDATE product_code=values(product_code), custom_product_code=values(custom_product_code), 
        product_name=values(product_name), supply_product_name=values(supply_product_name), price=values(price), 
        display=values(display), selling=values(selling), tax_type=values(tax_type), 
        list_image=values(list_image), manufacturer_code=values(manufacturer_code),
        trend_code=values(trend_code), brand_code=values(brand_code), supplier_code=values(supplier_code), 
        created_date=values(created_date), updated_date=values(updated_date), update_cnt=update_cnt+1`;

      util.sqlData(productDataSql, [productDataArray]);
    }
    await util.delayTime(1000);
  }

  const productNumberDatas = await util.sqlData("SELECT product_code, product_no FROM cmipdb.api_productdata");
  const productNumbers = productNumberDatas.map((row) => [row.product_code, row.product_no]);

  const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);

  client.authorize(async function (err, tokens) {
    if (err) return;
    const gsapi = google.sheets({ version: "v4", auth: client });
    const options = {
      spreadsheetId: "1-yQ4Ezh9GgqnAlvEl1CAQgkvZIpF3Sls7lpPFUvpJgM",
      range: "productNo!A2",
      valueInputOption: "USER_ENTERED",
      resource: { values: productNumbers },
    };
    await gsapi.spreadsheets.values.update(options);
  });

  console.log("kr product data update complete");
}

async function updateProductJP() {
  const token = await util.sqlData(`SELECT access_token FROM i_cafe24auth`);
  const setHeaders = {
    Authorization: "Bearer " + token[token.length - 1].access_token,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": "2022-06-01",
  };
  const countOptions = {
    method: "GET",
    url: `https://moomooz.cafe24api.com/api/v2/admin/products/count?shop_no=2`,
    headers: setHeaders,
  };

  const resCountData = JSON.parse(await util.requestData(countOptions));
  const latestProductNo = resCountData.count + 100000;

  const fieldData =
    "product_no,product_code,custom_product_code,product_name,supply_product_name,eng_product_name,internal_product_name,price,display,selling,tax_type,list_image,manufacturer_code,trend_code,brand_code,supplier_code,hscode,clearance_category_kor,clearance_category_code,english_product_material,cloth_fabric,created_date,updated_date";
  console.log("jp product data update start");

  for (let i = 0; 100 * i < latestProductNo; i++) {
    const productOptions = {
      method: "GET",
      url: `https://moomooz.cafe24api.com/api/v2/admin/products?shop_no=2&since_product_no=${
        100 * i
      }&fields=${fieldData}&limit=100`,
      headers: setHeaders,
    };

    const resProductData = JSON.parse(await util.requestData(productOptions));
    const productsArray = resProductData.products;

    if (productsArray != undefined) {
      const productDataArray = productsArray.map((u) => [
        u.product_no,
        u.product_code,
        u.custom_product_code,
        u.product_name,
        u.supply_product_name,
        u.eng_product_name,
        u.price,
        u.display,
        u.selling,
        u.tax_type,
        u.list_image,
        u.manufacturer_code,
        u.trend_code,
        u.brand_code,
        u.supplier_code,
        u.hscode,
        u.clearance_category_kor,
        u.clearance_category_code,
        u.english_product_material,
        u.cloth_fabric,
        new Date(Date.parse(u.created_date)),
        new Date(Date.parse(u.updated_date)),
      ]);

      const productDataSql = `INSERT INTO cmipdb.api_productdata_jp (product_no,product_code,custom_product_code,
        product_name,supply_product_name,eng_product_name,price,display,selling,
        tax_type,list_image,manufacturer_code,trend_code,brand_code,supplier_code,
        hscode,clearance_category_kor,clearance_category_code,english_product_material,cloth_fabric,created_date,updated_date) 
      VALUES ? ON DUPLICATE KEY UPDATE product_code=values(product_code), custom_product_code=values(custom_product_code), 
        product_name=values(product_name), supply_product_name=values(supply_product_name), eng_product_name=values(eng_product_name), price=values(price), 
        display=values(display), selling=values(selling), tax_type=values(tax_type), 
        list_image=values(list_image), manufacturer_code=values(manufacturer_code),
        trend_code=values(trend_code), brand_code=values(brand_code), supplier_code=values(supplier_code),
        hscode=values(hscode), clearance_category_kor=values(clearance_category_kor), clearance_category_code=values(clearance_category_code), 
        english_product_material=values(english_product_material), cloth_fabric=values(cloth_fabric),
        created_date=values(created_date), updated_date=values(updated_date)`;

      util.sqlData(productDataSql, [productDataArray]);
    }
    await util.delayTime(1000);
  }
  console.log("jp product data update complete");
}
