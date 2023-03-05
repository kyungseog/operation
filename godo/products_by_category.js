'use strict'

const util = require("../data-center/utility.js");

(async function start() {
    const dataArray = await util.sqlData('SELECT id FROM management.korea_categories WHERE check_products = "y"');
    const cateCd = dataArray.map( r => r.id )
    for (let cate of cateCd) {
        let data = await getCount(cate);
        console.log(data);
    }
})();

async function getCount(cateCd) {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( { cateCd: cateCd } );

    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Goods_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.requestData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const pageCount = Number(jsonData.data.header[0].max_page[0]);
    console.log("total page count : ", pageCount);

    for(let i = 0; i < pageCount; i++) {
        let data = await getProductByCategory(cateCd, i + 1);
        console.log(i + 1, "/", pageCount, data);
    };
    return cateCd + "update complete"
}

async function getProductByCategory(cateCd, pageCount) {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {
        cateCd: cateCd, 
        page: pageCount} );

    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Goods_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.requestData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const goodsData = jsonData.data.return[0].goods_data;
    const uploadData = goodsData.map( r => [cateCd, r.goodsNo[0], r.brandCd[0]] );
    const insertProductByCategorySql = `
        INSERT INTO management.product_categories 
            (category_id, product_id, brand_id)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
            brand_id=values(brand_id)`;

    util.param.db.query(insertProductByCategorySql, [uploadData]);
    return cateCd + "products update complete";
}
