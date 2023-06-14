"use strict";

const schedule = require("node-schedule");
const { DateTime } = require("luxon");
const excel = require("exceljs");
const fs = require("fs");
const util = require("../data-center/utility.js");

const endDate = DateTime.now().toFormat("yyyy-LL-dd");
const addParam = `scmNo=1&searchDateType=regDt&startDate=2022-08-12&endDate=${endDate}`;

const getProductRule = new schedule.RecurrenceRule();
getProductRule.dayOfWeek = [1, 2, 3, 4, 5];
getProductRule.hour = 8;
getProductRule.minute = 0;
schedule.scheduleJob("getExcel", getProductRule, function () {
  getExcel();
});

const notiRule = new schedule.RecurrenceRule();
notiRule.dayOfWeek = [1, 2, 3, 4, 5];
notiRule.hour = 9;
notiRule.minute = 0;
schedule.scheduleJob("noti", notiRule, function () {
  notiSlack();
});

async function getExcel() {
  const wb = new excel.Workbook();
  await wb.xlsx.readFile("./templates/notification_reserve_date_template.xlsx");

  const options = {
    method: "POST",
    url: `${util.param.main_url}/goods/Goods_Search.php?${util.param.main_key}&${addParam}`,
  };

  const xmlRowData = await util.requestData(options);
  const jsonData = await util.parseXml(xmlRowData);
  let pageCount = Number(jsonData.data.header[0].max_page[0]);
  let goodsData = [];
  let optionData = [];
  for (let i = 0; i < pageCount; i++) {
    let data = await getProduct(i + 1);
    goodsData.push(...data.goodsDataArray);
    optionData.push(...data.optionDataArray);
    console.log(i + 1, "/", pageCount, " page update complete");
  }

  if (goodsData.length != 0) {
    const ws1 = wb.getWorksheet("data");
    const ws2 = wb.getWorksheet("option");
    ws1.columns = [
      { key: "goodsNo", width: 15 },
      { key: "brandCd", width: 15 },
      { key: "purchaseNm", width: 15 },
      { key: "goodsNm", width: 30 },
      { key: "goodsDisplayMobileFl", width: 10 },
      { key: "goodsSellMobileFl", width: 10 },
      { key: "goodsCd", width: 15 },
      { key: "goodsReserveOrderMessage", width: 20 },
    ];
    ws1.insertRows(2, goodsData);

    ws2.columns = [
      { key: "goodsNo", width: 15 },
      { key: "brandCd", width: 15 },
      { key: "purchaseNm", width: 15 },
      { key: "goodsNm", width: 30 },
      { key: "sno", width: 10 },
      { key: "optionViewFl", width: 10 },
      { key: "optionSellFl", width: 10 },
      { key: "optionCode", width: 50 },
      { key: "optionDeliveryFl", width: 10 },
    ];
    ws2.insertRows(2, optionData);

    await wb.xlsx.writeFile(`./files/reserve_${DateTime.now().toFormat("yyyyLLdd")}.xlsx`);
  }
}

async function getProduct(pageNo) {
  const options = {
    method: "POST",
    url: `${util.param.main_url}/goods/Goods_Search.php?${util.param.main_key}&${addParam}&page=${pageNo}`,
  };

  const xmlRowData = await util.requestData(options);
  const jsonData = await util.parseXml(xmlRowData);
  const goodsData = jsonData.data.return[0].goods_data;

  const selectedGoodsData = goodsData.filter(function (el) {
    const data = el.goodsReserveOrderMessage[0];
    let targetDate = "";
    if (data != "") {
      data.replace(/ /g, "");

      const checkIndex = data.indexOf("]");
      let monthIndex = data.indexOf("월");
      let dayIndex = data.indexOf("일");
      let monthData = 0;
      let dayData = 0;

      if (checkIndex > 0) {
        monthIndex = data.indexOf("월", checkIndex);
        dayIndex = data.indexOf("일", checkIndex);
        monthData = Number(data.substring(data.indexOf("]") + 1, monthIndex));
        dayData = Number(data.substring(monthIndex + 1, dayIndex));
      } else {
        monthData = Number(data.substring(0, monthIndex));
        dayData = Number(data.substring(monthIndex + 1, dayIndex));
      }

      targetDate = DateTime.fromObject({ month: monthData, day: dayData }).toFormat("LLdd");
    }
    return data != "" && targetDate <= DateTime.now().plus({ days: 4 }).toFormat("LLdd");
  });

  let goodsDataArray;

  if (selectedGoodsData.length == 0) {
    goodsDataArray = [];
  } else {
    goodsDataArray = selectedGoodsData.map((r) => [
      r.goodsNo[0],
      r.brandCd[0],
      r.purchaseNm == undefined ? null : r.purchaseNm[0],
      r.goodsNm[0],
      r.goodsDisplayFl[0],
      r.goodsSellFl[0],
      r.goodsCd[0],
      r.goodsReserveOrderMessage[0],
    ]);
  }

  let selectedOptionData = [];
  for (let i = 0; i < goodsData.length; i++) {
    if (goodsData[i].optionData) {
      const option = goodsData[i].optionData;
      const purchaseNm = goodsData[i].purchaseNm == undefined ? null : goodsData[i].purchaseNm[0];
      const obj2 = {
        brandCd: goodsData[i].brandCd[0],
        purchaseNm: purchaseNm,
        goodsNm: goodsData[i].goodsNm[0],
      };
      const delayData = option.filter((d) => d.optionDeliveryFl[0] == "t");
      if (delayData.length != 0) {
        let tempArray = delayData.map((obj) => Object.assign(obj, obj2));
        selectedOptionData.push(...tempArray);
      }
    }
  }

  let optionDataArray = [];

  if (selectedOptionData.length == 0) {
    optionDataArray = [];
  } else {
    for (let i = 0; i < selectedOptionData.length; i++) {
      let r = selectedOptionData[i];
      let temp = [
        r.goodsNo[0],
        r.brandCd,
        r.purchaseNm,
        r.goodsNm,
        r.sno[0],
        r.optionViewFl[0],
        r.optionSellFl[0],
        r.optionCode[0],
        r.optionDeliveryFl[0],
      ];
      optionDataArray.push(temp);
    }
  }
  return { goodsDataArray, optionDataArray };
}

//kr_무무즈 채널 번호 GQUJ3SB8S
async function notiSlack() {
  if (fs.existsSync(__dirname + "/files/reserve_" + DateTime.now().toFormat("yyyyLLdd") + ".xlsx")) {
    try {
      const result = await util.slackApp.client.files.upload({
        channels: "GQUJ3SB8S",
        initial_comment: `<@US6E9DY66> <@U015JK6LXLK> <@U01UP606GV8> *예약 배송일이 지났거나 임박한* 상품과 *옵션배송상태가 배송지연*으로 선택된 상품입니다.\n`,
        file: fs.createReadStream(__dirname + "/files/reserve_" + DateTime.now().toFormat("yyyyLLdd") + ".xlsx"),
      });
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}
