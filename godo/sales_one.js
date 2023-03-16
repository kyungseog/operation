"use strict";

const util = require("../data-center/utility.js");

(async function getOrderData() {
  const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify({ orderNo: "2303141523001659" });

  const options = { method: "POST", url: `${util.param.main_url}/order/Order_Search.php?${paramDetail}` };

  const xmlRowData = await util.requestData(options);
  const jsonData = await util.parseXml(xmlRowData);

  console.log(jsonData.data.return[0].order_data[0].orderGoodsData);
})();
