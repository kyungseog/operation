"use strict";

const util = require("./utility.js");

updateMonthKoreaBrand();

async function updateMonthKoreaBrand() {
  const salesSql = `
    SELECT b.brand_id 
      , c.brand_name
      , c.account_type 
      , d.id AS supplier_id
      , d.integration_name AS supplier_name
      , count(DISTINCT(a.id)) AS order_count
      , sum(a.quantity) AS quantity 
      , sum((a.sale_price- a.discount_price) * a.quantity) AS sales
      , round(sum((a.sale_price - a.discount_price) * a.quantity * a.commission_rate/100)) AS commission
      , sum(IF(e.cost IS NULL, 0, e.cost) * a.quantity) AS cost 
      , sum(a.order_coupon) AS order_coupon 
      , sum(a.product_coupon) AS product_coupon 
      , sum(a.mileage) AS mileage 
      , IF(a.channel = "shop", ROUND(SUM((a.sale_price - a.discount_price) * a.quantity - a.mileage - a.order_coupon - a.product_coupon) * 0.032), ROUND(SUM((a.sale_price - a.discount_price) * a.quantity - a.mileage - a.order_coupon - a.product_coupon) * 0.034)) AS pg_fee
    FROM management.korea_orders a
      LEFT JOIN management.products b ON a.product_id = b.id
      LEFT JOIN management.brands c ON b.brand_id = c.id 
      LEFT JOIN management.suppliers d ON c.supplier_id = d.id
      LEFT JOIN management.costs e ON a.product_variant_id = e.product_variant_id 
    WHERE a.status_id IN ('p1', 'g1', 'd1', 'd2', 's1')
      AND a.user_id != 'mmzJapan'
      AND YEAR(a.payment_date) = ? 
      AND MONTH(a.payment_date) = ?
    GROUP BY b.brand_id `;

  const directMarketingSql = `
    SELECT a.brand_id 
      , b.brand_name
      , b.account_type
      , c.id AS supplier_id
      , c.integration_name AS supplier_name
      , sum(a.cost) AS direct_marketing_fee
    FROM management.korea_marketing a
      LEFT JOIN management.brands b ON a.brand_id = b.id
      LEFT JOIN management.suppliers c ON b.supplier_id = c.id
    WHERE YEAR(a.created_at) = ? 
      AND MONTH(a.created_at) = ?
    GROUP BY a.brand_id`;

  const indirectMarketingSql = `
    SELECT a.brand_id 
      , b.brand_name
      , b.account_type
      , c.id AS supplier_id
      , c.integration_name AS supplier_name
      , sum(a.allocated_fee) AS indirect_marketing_fee
    FROM management.korea_allocation_fees a
      LEFT JOIN management.brands b ON a.brand_id = b.id
      LEFT JOIN management.suppliers c ON b.supplier_id = c.id
    WHERE a.account = 'marketing'
      AND YEAR(a.created_at) = ? 
      AND MONTH(a.created_at) = ?
    GROUP BY a.brand_id`;

  const logisticSql = `
    SELECT a.brand_id 
      , b.brand_name
      , b.account_type
      , c.id AS supplier_id
      , c.integration_name AS supplier_name
      , sum(a.allocated_fee) AS logistic_fee
    FROM management.korea_allocation_fees a
      LEFT JOIN management.brands b ON a.brand_id = b.id
      LEFT JOIN management.suppliers c ON b.supplier_id = c.id
    WHERE a.account = 'logistic'
      AND YEAR(a.created_at) = ? 
      AND MONTH(a.created_at) = ?
    GROUP BY a.brand_id`;

  const YEAR = 2023;
  const MONTH = 4;

  let uploadData = [];
  const salesData = await util.sqlData(salesSql, [YEAR, MONTH]);
  const directMarketingData = await util.sqlData(directMarketingSql, [YEAR, MONTH]);
  const indirectMarketingData = await util.sqlData(indirectMarketingSql, [YEAR, MONTH]);
  const logisticData = await util.sqlData(logisticSql, [YEAR, MONTH]);

  const salesBrands = salesData.map((r) => r.brand_id);
  const directMarketingBrands = directMarketingData.map((r) => r.brand_id);
  const indirectMarketingBrands = indirectMarketingData.map((r) => r.brand_id);
  const logisticBrands = logisticData.map((r) => r.brand_id);

  const monthBrands = [
    ...new Set([...salesBrands, ...directMarketingBrands, ...indirectMarketingBrands, ...logisticBrands]),
  ];

  for (let brand of monthBrands) {
    if (salesBrands.indexOf(brand) >= 0) {
      const brandData = salesData.filter((r) => r.brand_id == brand);
      const directMarketing = directMarketingData.filter((r) => r.brand_id == brand);
      const indirectMarketing = indirectMarketingData.filter((r) => r.brand_id == brand);
      const logistic = logisticData.filter((r) => r.brand_id == brand);

      const dataObj = {
        year: YEAR,
        month: MONTH,
        brand_id: brand,
        brand_name: brandData[0].brand_name,
        account_type: brandData[0].account_type,
        supplier_id: brandData[0].supplier_id,
        supplier_name: brandData[0].supplier_name,
        order_count: Number(brandData[0].order_count),
        quantity: Number(brandData[0].quantity),
        sales: Number(brandData[0].sales),
        commission: Number(brandData[0].commission),
        cost: Number(brandData[0].cost),
        order_coupon: Number(brandData[0].order_coupon),
        product_coupon: Number(brandData[0].product_coupon),
        mileage: Number(brandData[0].mileage),
        pg_fee: Number(brandData[0].pg_fee),
        direct_marketing_fee: directMarketing.length == 0 ? 0 : Number(directMarketingData[0].direct_marketing_fee),
        indirect_marketing_fee:
          indirectMarketing.length == 0 ? 0 : Number(indirectMarketingData[0].indirect_marketing_fee),
        logistic_fee: logistic.length == 0 ? 0 : Number(logisticData[0].logistic_fee),
      };
      uploadData.push(dataObj);
    } else if (directMarketingBrands.indexOf(brand) >= 0) {
      const directMarketing = directMarketingData.filter((r) => r.brand_id == brand);
      const indirectMarketing = indirectMarketingData.filter((r) => r.brand_id == brand);
      const logistic = logisticData.filter((r) => r.brand_id == brand);

      const dataObj = {
        year: YEAR,
        month: MONTH,
        brand_id: brand,
        brand_name: directMarketing[0].brand_name,
        account_type: directMarketing[0].account_type,
        supplier_id: directMarketing[0].supplier_id,
        supplier_name: directMarketing[0].supplier_name,
        order_count: 0,
        quantity: 0,
        sales: 0,
        commission: 0,
        cost: 0,
        order_coupon: 0,
        product_coupon: 0,
        mileage: 0,
        pg_fee: 0,
        direct_marketing_fee: Number(directMarketingData[0].direct_marketing_fee),
        indirect_marketing_fee:
          indirectMarketing.length == 0 ? 0 : Number(indirectMarketingData[0].indirect_marketing_fee),
        logistic_fee: logistic.length == 0 ? 0 : Number(logisticData[0].logistic_fee),
      };
      uploadData.push(dataObj);
    } else if (indirectMarketingBrands.indexOf(brand) >= 0) {
      const indirectMarketing = indirectMarketingData.filter((r) => r.brand_id == brand);
      const logistic = logisticData.filter((r) => r.brand_id == brand);

      const dataObj = {
        year: YEAR,
        month: MONTH,
        brand_id: brand,
        brand_name: indirectMarketing[0].brand_name,
        account_type: indirectMarketing[0].account_type,
        supplier_id: indirectMarketing[0].supplier_id,
        supplier_name: indirectMarketing[0].supplier_name,
        order_count: 0,
        quantity: 0,
        sales: 0,
        commission: 0,
        cost: 0,
        order_coupon: 0,
        product_coupon: 0,
        mileage: 0,
        pg_fee: 0,
        direct_marketing_fee: 0,
        indirect_marketing_fee: Number(indirectMarketingData[0].indirect_marketing_fee),
        logistic_fee: logistic.length == 0 ? 0 : Number(logisticData[0].logistic_fee),
      };
      uploadData.push(dataObj);
    } else {
      const logistic = logisticData.filter((r) => r.brand_id == brand);

      const dataObj = {
        year: YEAR,
        month: MONTH,
        brand_id: brand,
        brand_name: logistic[0].brand_name,
        account_type: logistic[0].account_type,
        supplier_id: logistic[0].supplier_id,
        supplier_name: logistic[0].supplier_name,
        order_count: 0,
        quantity: 0,
        sales: 0,
        commission: 0,
        cost: 0,
        order_coupon: 0,
        product_coupon: 0,
        mileage: 0,
        pg_fee: 0,
        direct_marketing_fee: 0,
        indirect_marketing_fee: 0,
        logistic_fee: Number(logisticData[0].logistic_fee),
      };
      uploadData.push(dataObj);
    }
  }

  for (let i = 0; i < uploadData.length; i++) {
    const updateSql = `
    INSERT INTO management.month_korea_brand 
    SET ?
    ON DUPLICATE KEY UPDATE 
      order_count=values(order_count)
    , quantity=values(quantity)
    , sales=values(sales) 
    , commission=values(commission) 
    , cost=values(cost) 
    , order_coupon=values(order_coupon) 
    , product_coupon=values(product_coupon) 
    , mileage=values(mileage)
    , pg_fee=values(pg_fee)
    , direct_marketing_fee=values(direct_marketing_fee)
    , indirect_marketing_fee=values(indirect_marketing_fee) 
    , logistic_fee=values(logistic_fee)`;

    const result = await util.sqlData(updateSql, uploadData[i]);
    console.log(i + 1, uploadData.length);
    console.log(result);
    util.delayTime(100);
  }
}
