"use strict";

const request = require("request");
const { google } = require("googleapis");
const JSONbigString = require("json-bigint")({ storeAsString: true });
const keys = require("../google/data.json");
const util = require("../data-center/utility.js");
const { DateTime } = require("luxon");

const updateDeliveriesRule = new util.lib.schedule.RecurrenceRule();
updateDeliveriesRule.dayOfWeek = [1, 2, 3, 4, 5];
updateDeliveriesRule.hour = 10;
updateDeliveriesRule.minute = 0;
util.lib.schedule.scheduleJob("updateDeliveries", updateDeliveriesRule, () => updateDeliveries());

const updateCouponRule = new util.lib.schedule.RecurrenceRule();
updateCouponRule.hour = 22;
updateCouponRule.minute = 1;
util.lib.schedule.scheduleJob("updateCoupon", updateCouponRule, () => updateCouponData());

async function updateDeliveries() {
  const jpDeliverySheetId = "1c2MwukZ72vUG11PbvbjEJ_EKJNbEusJDZQ8K02VCtcU";
  const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);

  client.authorize(async function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    } else {
      const gsapi = google.sheets({ version: "v4", auth: client });
      const getDeliveryDateOption = {
        spreadsheetId: jpDeliverySheetId,
        range: "data!A2:I20000",
      };

      const getDeliveryDate = await gsapi.spreadsheets.values.get(getDeliveryDateOption);
      const deliveryDate = getDeliveryDate.data.values;
      const deliveryDateData = deliveryDate.map(function (r) {
        let arrayData = Object.values(r);
        arrayData.length = 9;
        return arrayData;
      });

      util.sqlData(
        `INSERT INTO cmipdb.t_deliverydate_jp (tracking_no, tracking_status, 
        logistic_registed, warehouse_in, airway_start, airway_end, custom_end, local_delivery_start, local_delivery_end)
      VALUES ? ON DUPLICATE KEY UPDATE tracking_status=values(tracking_status), 
        logistic_registed=values(logistic_registed), warehouse_in=values(warehouse_in), airway_start=values(airway_start),
        airway_end=values(airway_end), custom_end=values(custom_end), local_delivery_start=values(local_delivery_start),
        local_delivery_end=values(local_delivery_end)`,
        [deliveryDateData]
      );

      const getDeliveryFeeOption = {
        spreadsheetId: jpDeliverySheetId,
        range: "delivery_fee!A2:P20000",
      };
      const getDeliveryFee = await gsapi.spreadsheets.values.get(getDeliveryFeeOption);
      const deliveryFee = getDeliveryFee.data.values;
      const deliveryFeeData = deliveryFee.map((row) => [
        row[0],
        row[2],
        row[4],
        row[9],
        row[10],
        row[11],
        row[12],
        row[13],
      ]);
      util.sqlData(
        `INSERT INTO cmipdb.t_deliverycost_jp (invoice_date, tracking_no, logistic_tracking_no, actual_weight, 
        volume_weight, adobt_weight, invoice_class, invoice_cost)
      VALUES ? ON DUPLICATE KEY UPDATE invoice_date=values(invoice_date), 
        logistic_tracking_no=values(logistic_tracking_no), actual_weight=values(actual_weight), volume_weight=values(volume_weight),
        adobt_weight=values(adobt_weight), invoice_cost=values(invoice_cost)`,
        [deliveryFeeData]
      );

      const getDeliveryExpenseOption = {
        spreadsheetId: jpDeliverySheetId,
        range: "expense!A2:P20000",
      };
      let getDeliveryExpense = await gsapi.spreadsheets.values.get(getDeliveryExpenseOption);
      let deliveryExpense = getDeliveryExpense.data.values;
      const deliveryExpenseData = deliveryExpense.map((row) => [
        row[0],
        row[2],
        row[4],
        row[9],
        row[10],
        row[11],
        row[12],
        row[13],
      ]);
      util.sqlData(
        `INSERT INTO cmipdb.t_deliverycost_jp (invoice_date, tracking_no, logistic_tracking_no, actual_weight, 
        volume_weight, adobt_weight, invoice_class, invoice_cost)
      VALUES ? ON DUPLICATE KEY UPDATE invoice_date=values(invoice_date), 
        logistic_tracking_no=values(logistic_tracking_no), actual_weight=values(actual_weight), volume_weight=values(volume_weight),
        adobt_weight=values(adobt_weight), invoice_cost=values(invoice_cost)`,
        [deliveryExpenseData]
      );

      console.log("jp delivery infomation Update Complete");
    }
  });
}

async function updateCouponData() {
  const token = await util.sqlData(`SELECT access_token FROM cmipdb.i_cafe24auth`);
  const setHeaders = {
    Authorization: "Bearer " + token[token.length - 1].access_token,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": "2022-03-01",
  };

  const maxOrderId = await util.sqlData(`SELECT MAX(order_id) AS order_id FROM apidb.api_coupon_jp`);
  const orderList = await util.sqlData(
    `SELECT order_id FROM apidb.api_orderdata_jp WHERE order_id > '${maxOrderId[0].order_id}' GROUP BY order_id`
  );
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "jp coupon data update start");

  for (let i = 0; i < orderList.length; i++) {
    const couponOptions = {
      method: "GET",
      url: `https://moomooz.cafe24api.com/api/v2/admin/orders/coupons?shop_no=2&order_id=${orderList[i].order_id}`,
      headers: setHeaders,
    };
    const couponData = await getCheckRequest(couponOptions);
    const couponList = couponData.coupons;
    if (!(couponList == undefined || couponList == null || couponList.length == 0)) {
      const couponDataArray = couponList.map((u) => [
        u.order_id,
        u.order_item_code,
        u.coupon_name,
        u.coupon_code,
        u.coupon_percent,
        u.coupon_value,
        u.order_id.concat(u.order_item_code, u.coupon_code),
      ]);

      util.sqlData(
        `INSERT INTO apidb.api_coupon_jp (order_id, order_item_code, coupon_name, coupon_code,
        coupon_percent, coupon_value, id) VALUES ? ON DUPLICATE KEY UPDATE 
        order_id=values(order_id), order_item_code=values(order_item_code), coupon_name=values(coupon_name), 
        coupon_code=values(coupon_code), coupon_percent=values(coupon_percent), coupon_value=values(coupon_value)`,
        [couponDataArray]
      );
    }
    await util.delayTime(500);
  }
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "jp coupon data update complete");
}

function getCheckRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (err, response, result) => {
      return err ? reject(err) : resolve(JSONbigString.parse(result));
    });
  });
}
