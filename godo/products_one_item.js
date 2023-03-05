'use strict'

const util = require("../data-center/utility.js");

getProduct();

async function getProduct() {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {
        cateCd: '065001', 
        page: 1,
        size : 10 } );

    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Goods_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.requestData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const goodsData = jsonData.data.return[0].goods_data;
    console.log(goodsData);

}
