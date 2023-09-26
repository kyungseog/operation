"use strict";

const util = require("../data-center/utility.js");
const { DateTime } = require("luxon");

const rule0230 = new util.lib.schedule.RecurrenceRule();
rule0230.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule0230.hour = 2;
rule0230.minute = 30;
util.lib.schedule.scheduleJob("jpSalesDay", rule0230, () => updateOrdersMonthly());

async function updateOrdersMonthly() {
  const token = await util.sqlData(`SELECT access_token FROM i_cafe24auth`);
  const setHeaders = {
    Authorization: "Bearer " + token[token.length - 1].access_token,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": "2022-06-01",
  };

  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "jp order data update start");

  for (let i = 0; i < 60; i++) {
    const targetDate = DateTime.now().minus({ days: i }).toFormat("yyyy-LL-dd");
    console.log(targetDate);
    await countOrders(setHeaders, targetDate);
    await util.delayTime(4000);
  }
  console.log(DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"), "jp order data update complete");
}

async function countOrders(setHeaders, targetDate) {
  const countOptions = {
    method: "GET",
    url: `https://moomooz.cafe24api.com/api/v2/admin/orders/count?shop_no=2&start_date=${targetDate}&end_date=${targetDate}&date_type=pay_date`,
    headers: setHeaders,
  };

  const resCountData = JSON.parse(await util.requestData(countOptions));
  const orderCount = resCountData.count;

  if (orderCount !== 0) {
    if (orderCount % 500 == 0) {
      for (let j = 1; j < orderCount / 500 + 1; j++) {
        await updateDatas(setHeaders, targetDate, j);
      }
    } else {
      for (let j = 1; j < parseInt(orderCount / 500) + 2; j++) {
        await updateDatas(setHeaders, targetDate, j);
      }
    }
  }
}

async function updateDatas(setHeaders, targetDate, j) {
  const orderOptions = {
    method: "GET",
    url: `https://moomooz.cafe24api.com/api/v2/admin/orders?shop_no=2&start_date=${targetDate}&end_date=${targetDate}&date_type=pay_date&embed=items,buyer,receivers&limit=500&offset=${
      500 * (j - 1)
    }`,
    headers: setHeaders,
  };

  const resOrderData = JSON.parse(await util.requestData(orderOptions));
  let ordersArray = resOrderData.orders;

  let orderDataArray = [];
  const accountCode = ["N10", "N20", "N21", "N22", "N30", "N40", "E00", "E10", "N01", "E12", "E13", "E20"];

  //일본몰 초기 배송번호 오류를 수정하기위한 내역
  const errorOrderItemCode = [
    "20220617-0001129-04",
    "20220616-0021415-03",
    "20220616-0021415-04",
    "20220616-0023293-02",
    "20220616-0003053-03",
    "20220616-0000524-02",
    "20220616-0000524-04",
    "20220616-0000524-05",
    "20220615-0016695-06",
    "20220614-0003438-02",
    "20220614-0002713-01",
    "20220614-0002713-02",
    "20220614-0002713-03",
    "20220615-0010723-01",
    "20220615-0010723-04",
    "20220614-0027447-02",
    "20220614-0028918-02",
    "20220613-0014471-05",
    "20220613-0014471-10",
    "20220612-0006246-10",
    "20220613-0005948-04",
    "20220612-0015819-06",
    "20220610-0018144-02",
  ];
  const fixTrackingNo = [
    "SEP22062203341",
    "SEP22062203354",
    "SEP22062203354",
    "SEP22062303649",
    "SEP22062002751",
    "SEP22062303673",
    "SEP22062303673",
    "SEP22062303673",
    "SEP22062002744",
    "SEP22062303665",
    "SEP22062002747",
    "SEP22062002747",
    "SEP22062002747",
    "SEP22062002746",
    "SEP22062002746",
    "SEP22062002742",
    "SEP22062303663",
    "SEP22062002740",
    "SEP22062002740",
    "SEP22062203337",
    "SEP22061602108",
    "SEP22061702348",
    "SEP22062103147",
  ];

  for (let k = 0; k < ordersArray.length; k++) {
    let items = ordersArray[k].items;
    let receiver = ordersArray[k].receivers;
    for (let l = 0; l < items.length; l++) {
      let data = [
        new Date(Date.parse(ordersArray[k].order_date)),
        new Date(Date.parse(ordersArray[k].payment_date)),
        items[l].shipped_date === null ? null : new Date(Date.parse(items[l].shipped_date)),
        ordersArray[k].order_id,
        items[l].order_item_code,
        ordersArray[k].member_id,
        ordersArray[k].buyer.phone,
        ordersArray[k].buyer.cellphone,
        items[l].status_text,
        items[l].order_status,
        items[l].supplier_id,
        items[l].custom_product_code,
        items[l].custom_variant_code,
        items[l].product_no,
        items[l].product_code,
        items[l].product_name,
        items[l].variant_code,
        items[l].option_value,
        parseInt(items[l].product_price),
        items[l].option_price,
        items[l].quantity,
        parseInt(items[l].additional_discount_price),
        errorOrderItemCode.indexOf(items[l].order_item_code) >= 0
          ? fixTrackingNo[errorOrderItemCode.indexOf(items[l].order_item_code)]
          : items[l].tracking_no,
        items[l].product_tax_type,
        ordersArray[k].first_order,
        ordersArray[k].paid,
        ordersArray[k].group_no_when_ordering,
        receiver[0].cellphone,
        receiver[0].phone,
        receiver[0].zipcode,
        accountCode.indexOf(items[l].order_status) >= 0 ? "T" : "F",
        items[l].product_bundle,
      ];
      orderDataArray.push(data);
    }
  }

  const orderDataSql = `INSERT INTO apidb.api_orderdata_jp (order_date,payment_date,shipped_date,order_id,
    order_item_code,member_id,member_phone,member_cellphone,status_text,order_status,
    supplier_code,custom_product_code,custom_variant_code,product_no,product_code,product_name,
    variant_code,option_value,product_price,option_price,quantity,
    additional_discount_price,tracking_no,product_tax_type,first_order,paid,group_no_when_ordering,
    receiver_cellphone,receiver_phone,receiver_zipcode,account_code,product_bundle)
  VALUES ? ON DUPLICATE KEY UPDATE order_date=values(order_date), payment_date=values(payment_date),
    shipped_date=values(shipped_date), order_id=values(order_id), member_id=values(member_id), 
    member_phone=values(member_phone), member_cellphone=values(member_cellphone), status_text=values(status_text), 
    order_status=values(order_status), supplier_code=values(supplier_code), custom_product_code=values(custom_product_code), 
    custom_variant_code=values(custom_variant_code),product_no=values(product_no), 
    product_code=values(product_code), product_name=values(product_name), variant_code=values(variant_code), 
    option_value=values(option_value), product_price=values(product_price),
    option_price=values(option_price), quantity=values(quantity), additional_discount_price=values(additional_discount_price), 
    tracking_no=values(tracking_no), product_tax_type=values(product_tax_type), 
    first_order=values(first_order), paid=values(paid), group_no_when_ordering=values(group_no_when_ordering), 
    receiver_cellphone=values(receiver_cellphone), receiver_phone=values(receiver_phone), receiver_zipcode=values(receiver_zipcode), 
    account_code=values(account_code), product_bundle=values(product_bundle)`;

  util.sqlData(orderDataSql, [orderDataArray]);
  console.log(targetDate, " update complete");
  orderDataArray = [];
  ordersArray = [];
}
