'use strict'

const util = require("../data-center/utility.js");

(async function getCategoryData() {
    const paramDetail = util.param.main_key;

    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Category_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.requestData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const codeDataArray = jsonData.data.return[0].category_data;
    const codeData = codeDataArray.map( r => [r.cateCd[0],r.cateNm[0],r.cateDisplayFl[0],r.cateDisplayMobileFl[0]] ).join("\n");
    console.log(codeData);
})();