"use strict";

const { DateTime } = require("luxon");
const util = require("../data-center/utility.js");

const rule = new util.lib.schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule.hour = 3;
rule.minute = 30;

util.lib.schedule.scheduleJob("sales", rule, () => start());

async function start() {
  let targetDate = [];
  for (let i = 1; i <= 20; i++) {
    let target = DateTime.now().minus({ days: i }).toFormat("yyyy-LL-dd");
    targetDate.push(target);
  }

  for (let i = 0; i < targetDate.length; i++) {
    const start1 = `${targetDate[i]} 00:00:00`;
    const end1 = `${targetDate[i]} 11:59:59`;
    const start2 = `${targetDate[i]} 12:00:00`;
    const end2 = `${targetDate[i]} 23:59:59`;

    const startDateArray = [start1, start2];
    const endDateArray = [end1, end2];
    const signal = await setOrderChannel(targetDate[i], startDateArray, endDateArray);
    await util.delayTime(1000);
    console.log(signal);
  }
}

async function setOrderChannel(targetDate, startDateArray, endDateArray) {
  const orderChannel = ["naverpay"]; //"shop",
  const orderStatus = [
    "o1",
    "p1",
    "g1",
    "d1",
    "d2",
    "s1",
    "c1",
    "c2",
    "c3",
    "c4",
    "b1",
    "b2",
    "b3",
    "b4",
    "e1",
    "e2",
    "e3",
    "e4",
    "e5",
    "r1",
    "r2",
    "r3",
  ];

  for (let i = 0; i < orderChannel.length; i++) {
    for (let j = 0; j < orderStatus.length; j++) {
      for (let k = 0; k < startDateArray.length; k++) {
        const d = await getOrderData(orderChannel[i], orderStatus[j], startDateArray[k], endDateArray[k]);
        await util.delayTime(1000);
        console.log(d);
      }
      await util.delayTime(1000);
    }
    await util.delayTime(1000);
    console.log(targetDate + " / " + orderChannel[i] + " update complete");
  }
  return "complete";
}

async function getOrderData(channel, status, startDate, endDate) {
  const paramDetail =
    util.param.main_key +
    "&" +
    util.lib.qs.stringify({
      dateType: "order",
      startDate: startDate,
      endDate: endDate,
      orderChannel: channel,
      orderStatus: status,
    });

  const options = { method: "POST", url: `${util.param.main_url}/order/Order_Search.php?${paramDetail}` };

  const xmlRowData = await util.xmlData(options);
  const jsonData = await util.parseXml(xmlRowData);

  if (jsonData.data == undefined) {
    return "header data error";
  } else {
    if (jsonData.data.header[0].code == "000") {
      const orderData = jsonData.data.return[0].order_data;
      if (orderData) {
        for (let i = 0; i < orderData.length; i++) {
          console.log("update order count: ", i + 1, "/", orderData.length);
          if (orderData[i].orderGoodsData === undefined) {
            return;
          }
          console.log("update order goods count: ", orderData[i].orderGoodsData.length);

          const updateArray = orderData[i].orderGoodsData.map((s) => [
            s.sno[0],
            s.orderNo[0],
            orderData[i].orderDate[0],
            s.paymentDt[0],
            s.deliveryDt[0],
            s.goodsNo[0],
            s.optionSno[0],
            Number(s.fixedPrice[0]),
            Number(s.goodsPrice[0]) + Number(s.optionPrice[0]),
            Math.round(Number(s.goodsDcPrice[0]) / Number(s.goodsCnt[0])),
            Number(s.goodsCnt[0]),
            orderData[i].memId == undefined ? null : orderData[i].memId[0],
            s.orderStatus[0],
            s.commission[0],
            Number(s.divisionUseDeposit[0]) + Number(s.divisionGoodsDeliveryUseDeposit[0]),
            Number(s.divisionUseMileage[0]) + Number(s.divisionGoodsDeliveryUseMileage[0]),
            Number(s.divisionCouponOrderDcPrice[0]) + Number(s.memberDcPrice[0]),
            s.couponGoodsDcPrice[0],
            orderData[i].orderChannelFl[0],
            Number(orderData[i].settlePrice[0]),
            orderData[i].memGroupNm === undefined ? null : orderData[i].memGroupNm[0],
            orderData[i].firstSaleFl[0],
            s.scmNo[0],
          ]);

          const insertOrderSql = `
                        INSERT INTO management.korea_orders 
                            (order_item_id 
                            , id
                            , order_date 
                            , payment_date 
                            , delivery_date 
                            , product_id
                            , product_variant_id
                            , fixed_price
                            , sale_price
                            , discount_price
                            , quantity
                            , user_id
                            , status_id
                            , commission_rate
                            , deposit
                            , mileage
                            , order_coupon
                            , product_coupon
                            , channel
                            , payment_price
                            , user_group
                            , is_first
                            , supplier_id)
                        VALUES ?
                        ON DUPLICATE KEY UPDATE 
                            id=values(id)
                            , order_date=values(order_date)
                            , payment_date=values(payment_date)
                            , delivery_date=values(delivery_date)
                            , product_id=values(product_id)
                            , product_variant_id=values(product_variant_id)
                            , fixed_price=values(fixed_price)
                            , sale_price=values(sale_price)
                            , discount_price=values(discount_price)
                            , quantity=values(quantity)
                            , user_id=values(user_id)
                            , status_id=values(status_id)
                            , commission_rate=values(commission_rate)
                            , deposit=values(deposit)
                            , mileage=values(mileage)
                            , order_coupon=values(order_coupon)
                            , product_coupon=values(product_coupon)
                            , channel=values(channel)
                            , payment_price=values(payment_price)
                            , user_group=values(user_group)
                            , is_first=values(is_first)
                            , supplier_id=values(supplier_id)`;

          util.param.db.query(insertOrderSql, [updateArray]);
          await util.delayTime(1000);
        }
        return channel + " / " + status + " / " + startDate + " update complete";
      }
    } else {
      return channel + " / " + status + " / " + startDate + " Error";
    }
    return channel + " / " + status + " / " + startDate + " No Data";
  }
}
