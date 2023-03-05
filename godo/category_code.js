'use strict'

const util = require("../data-center/utility.js");

(async function getCategoryData() {
    const paramDetail = util.param.main_key;
    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Category_Search.php?${paramDetail}&cateCd=009`
    };

    const xmlRowData = await util.requestData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const codeDataArray = jsonData.data.return[0].category_data;
    const codeData = codeDataArray.map( r => [r.cateCd[0],r.cateNm[0],r.cateDisplayFl[0],r.cateDisplayMobileFl[0]] );
    console.log(codeData)
    const insertCodeSql = `
        INSERT INTO management.korea_categories
            (id
            , name
            , display_flag
            , display_mobile_flag)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
            name=values(name)
            , display_flag=values(display_flag)
            , display_mobile_flag=values(display_mobile_flag)`;
    util.param.db.query(insertCodeSql, [codeData]);
    console.log('update complete')
})();