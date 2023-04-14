"use strict";

const { DateTime } = require("luxon");
const util = require("../data-center/utility.js");

(async function start() {
  let targetDate = [];
  for (let i = 1; i <= 13; i++) {
    let day = i < 10 ? "0" + i : i;
    targetDate.push("2023-04-" + day);
  }

  for (let i = 0; i < targetDate.length; i++) {
    const marketing = await allocationMarketingFees(targetDate[i]);
    console.log("marketing", marketing);
    const logistic = await calculationLogisticFees(targetDate[i]);
    console.log("logistic", logistic);
    await util.delayTime(1000);
  }
})();

async function allocationMarketingFees(createdAt) {
  const getDailySalesByBrand = `
  SELECT b.brand_id
    , SUM((a.sale_price - a.discount_price) * a.quantity) as sales_price
      , SUM((a.sale_price - a.discount_price) * a.quantity) * 100 / SUM(SUM((a.sale_price - a.discount_price) * a.quantity)) OVER() as ratio
      , ROUND(im.indirect_marketing * SUM((a.sale_price - a.discount_price) * a.quantity) / SUM(SUM((a.sale_price - a.discount_price) * a.quantity)) OVER()) as allocated_fee
  FROM management.korea_orders a
    left join management.products b on a.product_id = b.id
    left join management.brands c on b.brand_id = c.id,
      (select SUM(a.cost) as indirect_marketing
      from management.korea_marketing a
        left join management.brands b on a.brand_id = b.id
      where a.created_at = ?
      and b.id is null) im
  where a.payment_date BETWEEN ? AND ?
    and a.status_id in ('p1', 'g1', 'd1', 'd2', 's1')
    and a.user_id != 'mmzjapan'
  group by b.brand_id`;

  const salesDataByBrand = await util.sqlData(getDailySalesByBrand, [
    createdAt,
    createdAt,
    DateTime.fromISO(createdAt).plus({ days: 1 }).toFormat("yyyy-LL-dd"),
  ]);

  const marketingFeeData = salesDataByBrand.map((r) => [
    createdAt,
    "marketing",
    r.brand_id == null ? "B0000000" : r.brand_id,
    r.allocated_fee,
  ]);

  const insertAllocatedMarketingFee = `
      INSERT INTO management.korea_allocation_fees
          (created_at
          , account
          , brand_id
          , allocated_fee)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        allocated_fee=values(allocated_fee)`;
  util.param.db.query(insertAllocatedMarketingFee, [marketingFeeData]);

  return createdAt + " update complete";
}

async function calculationLogisticFees(createdAt) {
  const getDailyLogisticFees = `
  SELECT tt.brand_id
        , SUM(tt.polybag) + SUM(tt.logistic_fixed) AS logistic_fee
      FROM (
        SELECT a.id
          , b.brand_id
          , SUM(a.quantity) * 52 as polybag
          , co.logistic_fixed
        FROM management.korea_orders a
          LEFT JOIN management.products b on a.product_id = b.id
          LEFT JOIN management.brands c on b.brand_id = c.id
          LEFT JOIN management.suppliers d on c.supplier_id = d.id
          LEFT JOIN (
            SELECT a.id
              , ROUND((4000 + 3400) / COUNT(a.id)) as logistic_fixed 
            FROM ( 
              SELECT a.id, b.brand_id
              FROM management.korea_orders a
                LEFT JOIN management.products b on a.product_id = b.id
                LEFT JOIN management.brands c on b.brand_id = c.id
                LEFT JOIN management.suppliers d on c.supplier_id = d.id
              WHERE a.payment_date BETWEEN ? AND ?
                AND d.id = '1' 
                AND a.status_id IN ('p1','g1','d1','d2','s1')
              GROUP BY a.id, b.brand_id
            ) a 
          GROUP BY a.id
          ) co ON a.id = co.id
      WHERE a.payment_date BETWEEN ? AND ?
        AND d.id = '1'
        AND a.status_id IN ('p1','g1','d1','d2','s1')
      GROUP BY a.id, b.brand_id
      ) tt
      GROUP by tt.brand_id `;

  const logisticDataByBrand = await util.sqlData(getDailyLogisticFees, [
    createdAt,
    DateTime.fromISO(createdAt).plus({ days: 1 }).toFormat("yyyy-LL-dd"),
    createdAt,
    DateTime.fromISO(createdAt).plus({ days: 1 }).toFormat("yyyy-LL-dd"),
  ]);

  const logisticFeeData = logisticDataByBrand.map((r) => [
    createdAt,
    "logistic",
    r.brand_id == null ? "B0000000" : r.brand_id,
    r.logistic_fee,
  ]);

  const insertCalculatedLogisticFee = `
      INSERT INTO management.korea_allocation_fees
          (created_at
          , account
          , brand_id
          , allocated_fee)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        allocated_fee=values(allocated_fee)`;
  util.param.db.query(insertCalculatedLogisticFee, [logisticFeeData]);

  return createdAt + " update complete";
}
