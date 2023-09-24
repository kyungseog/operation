"use strict";

const schedule = require("node-schedule");
const { DateTime } = require("luxon");
const util = require("../data-center/utility.js");

const notiRule = new schedule.RecurrenceRule();
notiRule.dayOfWeek = [1, 2, 3, 4, 5];
notiRule.hour = 15;
notiRule.minute = 0;
schedule.scheduleJob("noti", notiRule, function () {
  notiOrderQuantity();
});

//물류센터-팀공유 채널 번호 C01VA4QAM7F, logistic 담당자 그룹 S01FPTRM680
async function notiOrderQuantity() {
  const yesterday = DateTime.now().minus({ days: 1 }).toFormat("yyyy-LL-dd");
  const today = DateTime.now().toFormat("yyyy-LL-dd");
  const brandLists = '"B0000CZU","B0000DCM","B0000DGS","B0000DGT","B0000EVE","B0000DFV","B0000CAT","B0000EPN"';

  const yesterdayResponse = await util.sqlData(`
    SELECT COUNT(DISTINCT(a.id)) as count_orders, SUM(a.quantity) as quantity 
    FROM management.korea_orders a
      LEFT JOIN management.products b on a.product_id = b.id
    WHERE a.payment_date BETWEEN '${yesterday} 03:00:00' AND '${yesterday} 15:00:00'
      AND a.status_id IN ('p1','g1','d1','d2','s1')
      AND b.brand_id IN (${brandLists})`);

  const todayResponse = await util.sqlData(`
    SELECT c.id, c.brand_name, COUNT(DISTINCT(a.id)) as count_orders, SUM(a.quantity) as quantity 
    FROM management.korea_orders a
      LEFT JOIN management.products b on a.product_id = b.id
      LEFT JOIN management.brands c on b.brand_id  = c.id 
    WHERE a.payment_date BETWEEN '${today} 03:00:00' AND '${today} 15:00:00'
      AND a.status_id IN ('p1','g1','d1','d2','s1')
      AND c.id IN (${brandLists})
    GROUP BY c.id WITH ROLLUP`);

  let todayDatas = [];
  for (let i = 0; i < todayResponse.length - 1; i++) {
    todayDatas.push(
      `*${todayResponse[i].brand_name}*  >>  주문수 : ${Number(todayResponse[i].count_orders).toLocaleString(
        "ko-kr"
      )}개,  판매수량 : ${Number(todayResponse[i].quantity).toLocaleString("ko-kr")}장`
    );
  }

  const yesterdayGap = Number(todayResponse[todayResponse.length - 1].quantity) - Number(yesterdayResponse[0].quantity);
  const gapText =
    yesterdayGap > 0
      ? `${yesterdayGap.toLocaleString("ko-kr")}장 증가`
      : `${(yesterdayGap * -1).toLocaleString("ko-kr")}장 감소`;
  const mainText = `<@U04QQK1K673> <@UKMPMN57D> *알뜰배송 오늘 (새벽 3시 - 오후 3시까지) 매출 현황*\n\n 
    [ 세부내역 ] \n *주문수 : ${Number(todayResponse[todayResponse.length - 1].count_orders).toLocaleString(
      "ko-kr"
    )}개,  
    판매수량 : ${Number(todayResponse[todayResponse.length - 1].quantity).toLocaleString(
      "ko-kr"
    )}장* (어제대비 ${gapText})`;
  const subText = todayDatas.join("\n");

  try {
    const result = await util.slackApp.client.chat.postMessage({
      channel: "C01VA4QAM7F",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: mainText,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: subText,
          },
        },
      ],
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
