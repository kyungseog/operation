'use strict'

const util = require("../data-center/utility.js");

(async function getSCMData() {
    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {code_type: 'scm'} );

    const options = { method: 'POST',
        url: `${util.param.main_url}/common/Code_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.requestData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const codeDataArray = jsonData.data.return[0].code_data;
    const codeData = codeDataArray.map( r => [r.scmNo[0],r.companyNm[0]] ).join("\n");
    console.log(codeData);
})();