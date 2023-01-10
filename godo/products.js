'use strict'

const util = require("../data-center/utility.js");

const startDate = util.lib.today.minus({days: 1}).toFormat('yyyy-LL-dd');
const endDate = util.lib.today.toFormat('yyyy-LL-dd');

const rule = new util.lib.schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule.hour = 4;
rule.minute = 40;

util.lib.schedule.scheduleJob( "getProductData", rule, () => getCount() );

async function getCount() {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {
        searchDateType: 'modDt', 
        startDate: startDate, 
        endDate: endDate } );

    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Goods_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.xmlData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const pageCount = Number(jsonData.data.header[0].max_page[0]);
    console.log("total page count : ", pageCount);

    for(let i = 0; i < pageCount; i++) {
        let data = await getProduct(i + 1);
        console.log(i + 1, "/", pageCount,data);
    };
}

async function getProduct(pageNo) {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {
        searchDateType: 'modDt', 
        startDate: startDate, 
        endDate: endDate,
        page: pageNo } );

    const options = { method: 'POST',
        url: `${util.param.main_url}/goods/Goods_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.xmlData(options);
    const jsonData = await util.parseXml(xmlRowData);
    const goodsData = jsonData.data.return[0].goods_data;
    console.log("update product count: ", goodsData.length);

    for(let i = 0; i < goodsData.length; i++) {
        const r = goodsData[i];

        const productData = [
            r.goodsNo[0],
            r.goodsNm[0],
            r.listImageData == undefined ? null : r.listImageData[0]._,
            r.brandCd[0],
            r.goodsCd[0],
            r.modDt[0] == '' ? null : r.modDt[0],
            r.trendNo[0] == '' ? null : r.trendNo[0],
            r.originNm[0] == '' ? null : Object.keys(util.lib.originData)[ Object.values(util.lib.originData).indexOf(r.originNm[0]) ],
            r.taxFreeFl[0],
            Number(r.fixedPrice[0]),
            Number(r.goodsPrice[0]),
            r.cafe24ProductCode[0] == '' ? null : r.cafe24ProductCode[0],
        ];
  
        const insertProductSql = `
            INSERT INTO management.products 
                (id
                , name
                , image
                , brand_id
                , custom_product_id
                , updated_at
                , seller_id
                , production_country
                , tax_type
                , fixed_price
                , product_price,
                , cafe_product_code)
            VALUES (?)
            ON DUPLICATE KEY UPDATE 
                name=values(name)
                , image=values(image)
                , brand_id=values(brand_id)
                , custom_product_id=values(custom_product_id)
                , updated_at=values(updated_at)
                , seller_id=values(seller_id)
                , production_country=values(production_country)
                , tax_type=values(tax_type)
                , fixed_price=values(fixed_price)
                , product_price=values(product_price)
                , cafe_product_code=values(cafe_product_code)`;

        util.param.db.query(insertProductSql, [productData]);

        if(r.optionData) {
            console.log("update option count: ", r.optionData.length);

            for(let j = 0; j < r.optionData.length; j++) {
                const s = r.optionData[j];

                const optionData = [
                    s.sno[0],
                    s.optionCode[0],
                    s.optionValue1[0],
                    s.optionValue2[0],
                    s.optionValue3[0],
                    s.optionValue4[0],
                    r.goodsNo[0],
                    Number(s.optionPrice[0]),
                    s.modDt[0] == '' ? null : s.modDt[0],
                    s.cafe24OptionCode[0] == '' ? null : s.cafe24OptionCode[0],
                ];

                const insertoptionSql = `
                    INSERT INTO management.product_variants 
                        (id
                        , custom_variant_id
                        , variant_color
                        , variant_size
                        , variant_etc1
                        , variant_etc2
                        , product_id
                        , option_price
                        , updated_at,
                        , cafe_variant_code) 
                    VALUES (?)
                    ON DUPLICATE KEY UPDATE 
                        custom_variant_id=values(custom_variant_id)
                        , variant_color=values(variant_color)
                        , variant_size=values(variant_size)
                        , variant_etc1=values(variant_etc1)
                        , variant_etc2=values(variant_etc2)
                        , product_id=values(product_id)
                        , option_price=values(option_price)
                        , updated_at=values(updated_at)
                        , cafe_variant_code=values(cafe_variant_code)`;

                util.param.db.query(insertoptionSql, [optionData]);
            }
        }
        await util.delayTime(2000);
    }
    return 'page update complete';
}