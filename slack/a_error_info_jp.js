"use strict";

const util = require("../data-center/utility.js");
const { DateTime } = require("luxon");
const excel = require("exceljs");
const fs = require("fs");

const productNotiRule = new util.lib.schedule.RecurrenceRule();
productNotiRule.dayOfWeek = [1, 2, 3, 4, 5];
productNotiRule.hour = 9;
productNotiRule.minute = 0;
util.lib.schedule.scheduleJob("productNoti", productNotiRule, () => productNoti());

const deliveryNotiRule = new util.lib.schedule.RecurrenceRule();
deliveryNotiRule.dayOfWeek = [1, 2, 3, 4, 5];
deliveryNotiRule.hour = 11;
deliveryNotiRule.minute = 0;
util.lib.schedule.scheduleJob("deliveryNoti", deliveryNotiRule, () => deliveryNoti());

async function productNoti() {
  const wb = new excel.Workbook();
  await wb.xlsx.readFile("./templates/noti_template.xlsx");

  const productNameErrorData = await util.sqlData(`
    SELECT b.supplier_name, c.brand_name, a.product_no, a.product_name
    FROM cmipdb.api_productdata_jp a 
      LEFT JOIN cmipdb.i_suppliercode b USING(supplier_code) 
      LEFT JOIN cmipdb.i_brandcode c USING(brand_code)
    WHERE a.display = 'T' AND a.selling = 'T' AND a.product_name REGEXP '[가-힇]'`);

  if (productNameErrorData) {
    const ws1 = wb.getWorksheet("product_name_error");

    ws1.columns = [
      { key: "supplier_name", width: 15 },
      { key: "brand_name", width: 15 },
      { key: "product_no", width: 13 },
      { key: "product_name", width: 20 },
    ];

    ws1.insertRows(2, productNameErrorData);
  }

  const shortageInfoData = await util.sqlData(
    `SELECT b.supplier_name, c.brand_name, a.product_no, a.product_code, 
    d.product_name AS product_name_kr, a.product_name AS product_name_jp,
      a.hscode, a.clearance_category_kor, a.clearance_category_code, 
      a.english_product_material, a.cloth_fabric
    FROM cmipdb.api_productdata_jp a
      LEFT JOIN cmipdb.i_suppliercode b USING(supplier_code) 
      LEFT JOIN cmipdb.i_brandcode c USING(brand_code)
      LEFT JOIN cmipdb.api_productdata d USING(product_no)
    WHERE a.display = 'T' 
      AND a.selling = 'T' 
      AND (a.hscode IS NULL 
        OR a.clearance_category_code IS NULL 
        OR a.english_product_material IS NULL 
        OR a.cloth_fabric IS NULL)`
  );

  if (!(shortageInfoData == undefined || shortageInfoData == null || shortageInfoData.length == 0)) {
    const ws2 = wb.getWorksheet("add_info_data");

    ws2.columns = [
      { key: "supplier_name", width: 15 },
      { key: "brand_name", width: 15 },
      { key: "product_no", width: 13 },
      { key: "product_code", width: 13 },
      { key: "product_name_kr", width: 20 },
      { key: "product_name_jp", width: 20 },
      { key: "hscode", width: 15 },
      { key: "clearance_category_kor", width: 20 },
      { key: "clearance_category_code", width: 13 },
      { key: "english_product_material", width: 20 },
      { key: "cloth_fabric", width: 13 },
    ];

    ws2.insertRows(2, shortageInfoData);
  }

  const variantNameErrorData = await util.sqlData(
    `SELECT c.supplier_name, d.brand_name, 
      a.product_no, a.variant_code, 
      a.option_value_first, a.option_value_second
    FROM cmipdb.api_variantdata_jp a
      LEFT JOIN cmipdb.api_productdata_jp b USING(product_no)
      LEFT JOIN cmipdb.i_suppliercode c USING(supplier_code) 
      LEFT JOIN cmipdb.i_brandcode d USING(brand_code)
    WHERE a.display = 'T' 
      AND a.selling = 'T' 
      AND (a.option_value_first REGEXP '[가-힇]' 
        OR a.option_value_second REGEXP '[가-힇]')`
  );

  if (!(variantNameErrorData == undefined || variantNameErrorData == null || variantNameErrorData.length == 0)) {
    const ws3 = wb.getWorksheet("option_name_error");

    ws3.columns = [
      { key: "supplier_name", width: 15 },
      { key: "brand_name", width: 15 },
      { key: "product_no", width: 13 },
      { key: "variant_code", width: 15 },
      { key: "option_value_first", width: 20 },
      { key: "option_value_second", width: 20 },
    ];

    ws3.insertRows(2, variantNameErrorData);
  }

  const variantErrorData = await util.sqlData(`
    SELECT a.product_no, c.supplier_name, b.product_name, 
      a.variant_code, a.display, a.selling, a.kr_display, 
      a.kr_selling, a.quantity
    FROM cmipdb.api_variantdata_jp a 
      LEFT JOIN cmipdb.api_productdata b USING(product_no)
      LEFT JOIN cmipdb.i_suppliercode c USING(supplier_code)
    WHERE a.display = 'T' AND a.selling = 'T' 
      AND (a.kr_display = 'F' or a.kr_selling = 'F')
    ORDER BY product_no DESC`);

  if (!(variantErrorData == undefined || variantErrorData == null || variantErrorData.length == 0)) {
    const ws4 = wb.getWorksheet("option_display_list");

    ws4.columns = [
      { key: "product_no", width: 15 },
      { key: "supplier_name", width: 15 },
      { key: "product_name", width: 25 },
      { key: "variant_code", width: 20 },
      { key: "display", width: 10 },
      { key: "selling", width: 10 },
      { key: "kr_display", width: 10 },
      { key: "kr_selling", width: 10 },
      { key: "quantity", width: 10 },
    ];

    ws4.insertRows(2, variantErrorData);
    await wb.xlsx.writeFile(`./files/noti_${DateTime.now().toFormat("yyyyMMdd")}.xlsx`);

    const initialComment = `<@U022RVD4AF2> <@U02UTEG8H7Z> <@U031P740VU4> <@U03170TR1HD> *일본몰 등록 상품 및 옵션의 확인이 필요한 내역입니다.*\n`;
    const fileName = "noti_" + DateTime.now().toFormat("yyyyLLdd") + ".xlsx";
    notiPublicSlack(initialComment, fileName);
  }
}

async function deliveryNoti() {
  const deliveryErrorRowData = await util.sqlData(`
    SELECT week(a.payment_date,7) AS weeks, DATE(a.payment_date) AS payment_date, a.order_id, a.tracking_no,
      DATEDIFF(d.local_delivery_end,a.payment_date) AS delivery_to_payment,
      DATEDIFF(a.shipped_date,a.payment_date) AS shipped_to_payment,
      DATEDIFF(d.airway_start,a.shipped_date) AS airway_to_shipped, 
      DATEDIFF(d.local_delivery_end,d.airway_start) AS delivery_to_airway,
      IF(d.tracking_status is NULL AND DATEDIFF(NOW(),a.payment_date) > 7, CONCAT('alert (', DATEDIFF(NOW(),a.payment_date), '일)'), NULL) AS today_to_payment_for_noti,
      if(d.local_delivery_end IS NULL AND DATEDIFF(NOW(),d.custom_end) > 3, CONCAT('alert (', DATEDIFF(NOW(),d.custom_end), '일)'), NULL) AS delivery_to_custom_for_noti,
      if(d.tracking_status IS NOT NULL AND DATEDIFF(d.local_delivery_end,a.payment_date) IS NULL AND  DATEDIFF(NOW(),a.shipped_date) > 10, CONCAT('alert (', DATEDIFF(NOW(),a.shipped_date), '일)'), NULL) AS today_to_shipped_for_noti,
      d.tracking_status, d.tracking_no
    FROM (SELECT * from apidb.api_orderdata_jp a WHERE a.order_status != 'C40'
      AND a.order_id NOT IN ('20220525-0021748','20220612-0006246','20220616-0024880','20220616-0017042','20220616-0016557',
        '20220617-0007441','20220616-0009495','20220616-0021415','20220617-0000709','20220618-0007641','20220618-0008993',
        '20220618-0002612','20220619-0001150','20220622-0006202','20220622-0015551','20220628-0007515','20220629-0021117',
        '20220630-0016138','20220703-0018406','20220708-0010272','20220713-0002042','20220714-0018882','20220729-0005159',
        '20220729-0006729','20220804-0002570','20220805-0003166','20220802-0001809','20220809-0010362','20220813-0000158',
        '20220813-0000136')) a
      LEFT JOIN cmipdb.t_jpkrordermatching b ON a.order_item_code = b.jp_order_item_code
      LEFT JOIN cmipdb.api_orderdata c ON b.kr_order_item_code = c.order_item_code
      LEFT JOIN cmipdb.t_deliverydate_jp d ON a.tracking_no = d.tracking_no
    GROUP BY a.tracking_no, a.order_id
    ORDER BY DATE(a.payment_date)`);

  const deliveryErrorData = deliveryErrorRowData.filter(
    (r) =>
      !(
        r.today_to_payment_for_noti == null &&
        r.delivery_to_custom_for_noti == null &&
        r.today_to_shipped_for_noti == null
      )
  );

  if (!(deliveryErrorData == undefined || deliveryErrorData == null || deliveryErrorData.length == 0)) {
    const wb = new excel.Workbook();
    await wb.xlsx.readFile("./templates/배송오류통보양식.xlsx");
    const ws = wb.getWorksheet("data");

    ws.columns = [
      { key: "weeks", width: 8 },
      { key: "payment_date", width: 15 },
      { key: "order_id", width: 20 },
      { key: "tracking_no", width: 20 },
      { key: "delivery_to_payment", width: 15 },
      { key: "shipped_to_payment", width: 15 },
      { key: "airway_to_shipped", width: 15 },
      { key: "delivery_to_airway", width: 15 },
      { key: "today_to_payment_for_noti", width: 15 },
      { key: "delivery_to_custom_for_noti", width: 15 },
      { key: "today_to_shipped_for_noti", width: 15 },
      { key: "tracking_status", width: 15 },
    ];

    ws.insertRows(2, deliveryErrorData);
    await wb.xlsx.writeFile(`./files/deliveryError_${DateTime.now().toFormat("yyyy-LL-dd")}.xlsx`);

    const deliveryInitialComment = `<@UKMPMN57D> <@U02FPGCLG2F> *주문 후 배송관련 확인이 필요한 주문내역입니다*\n아래 파일을 참고하세요\n`;
    const deliveryErrorFileName = "deliveryError_" + DateTime.now().toFormat("yyyy-LL-dd") + ".xlsx";
    notiSlack(deliveryInitialComment, deliveryErrorFileName);
  }
}

//무무즈재팬 채널 : C024JR3QWHF , 테스트시 이용하는 daily_report 채널 : C01GTUVCVAR, 무무즈-전담매니저 채널: C03EB4FU4CB
async function notiSlack(initialComment, fileName) {
  try {
    const result = await util.slackApp.client.files.upload({
      channels: "C024JR3QWHF",
      initial_comment: initialComment,
      file: fs.createReadStream(__dirname + "/files/" + fileName),
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function notiPublicSlack(initialComment, fileName) {
  try {
    const result = await util.slackApp.client.files.upload({
      channels: "C03EB4FU4CB",
      initial_comment: initialComment,
      file: fs.createReadStream(__dirname + "/files/" + fileName),
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
