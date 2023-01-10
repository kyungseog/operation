'use strict'

const util = require("../data-center/utility.js");

setInterval( () => {
    const startTime = util.lib.today.minus({minutes: 6}).toFormat('yyyy-LL-dd HH:mm:ss');
    const endTime = util.lib.today.toFormat('yyyy-LL-dd HH:mm:ss');
    let errorCount = 0;
    setOrderChannel(startTime, endTime, errorCount);
}, 5*60*1000);

async function setOrderChannel(startTime, endTime, errorCount) {
    console.log(startTime, endTime)
    const orderChannel = ["shop","naverpay"];

    for (let i = 0; i < orderChannel.length; i++) {
        const d = await getOrderData(orderChannel[i], startTime, endTime, errorCount);
        await util.delayTime(1000);
        console.log(d);
    }
}

async function getOrderData(channel, startDate, endDate, errorCount) {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {
        dateType: 'order', 
        startDate: startDate, 
        endDate: endDate, 
        orderChannel: channel} );

    const options = { method: 'POST',
        url: `${util.param.main_url}/order/Order_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.xmlData(options);
    const jsonData = await util.parseXml(xmlRowData);
    
    if(jsonData.data == undefined) {
        await util.delayTime(30000);
        errorCount++
        if( errorCount < 5 ) {
            getOrderData(channel, startDate, endDate)
        } else {
            return "header data error";
        } 
    } else {
        errorCount = 0;
        if(jsonData.data.header[0].code == '000') {
            const orderData = jsonData.data.return[0].order_data;
            if(orderData) {
                for(let i = 0; i < orderData.length; i++) {
                    console.log("update order count: ", i+1, "/", orderData.length);
                    console.log("update order goods count: ", orderData[i].orderGoodsData.length);
                    
                    const updateArray = orderData[i].orderGoodsData.map( 
                        (s) => [ 
                            s.sno[0], 
                            s.orderNo[0], 
                            orderData[i].orderDate[0], 
                            s.paymentDt[0], 
                            s.deliveryDt[0],
                            s.goodsNo[0],
                            s.optionSno[0], 
                            s.fixedPrice[0], 
                            (s.goodsPrice[0] + s.optionPrice[0]), 
                            s.goodsDcPrice[0], 
                            s.goodsCnt[0], 
                            orderData[i].memId == undefined ? null : orderData[i].memId[0],
                            s.orderStatus[0], 
                            s.commission[0] 
                        ] );
                        console.log(updateArray);

                    const insertOrderSql = `
                        INSERT INTO management.korea_orders 
                            (order_item_id 
                            , id
                            , order_date 
                            , payment_date 
                            , delivery_date 
                            , product_id
                            , product_variant_id
                            , fixed_price
                            , sale_price
                            , discount_price
                            , quantity
                            , user_id
                            , status_id
                            , commission_rate)
                        VALUES ?
                        ON DUPLICATE KEY UPDATE 
                            id=values(id)
                            , order_date=values(order_date)
                            , payment_date=values(payment_date)
                            , delivery_date=values(delivery_date)
                            , product_id=values(product_id)
                            , product_variant_id=values(product_variant_id)
                            , fixed_price=values(fixed_price)
                            , sale_price=values(sale_price)
                            , discount_price=values(discount_price)
                            , quantity=values(quantity)
                            , user_id=values(user_id)
                            , status_id=values(status_id)
                            , commission_rate=values(commission_rate)`;

                    util.param.db.query(insertOrderSql, [updateArray]);
                    await util.delayTime(1000);
                }
                return channel + " / " + endDate + " update complete";
            }
        } else {
            return channel + " / " + endDate + " Error";
        }
        return channel + " / " + endDate + " No Data";
    }
}