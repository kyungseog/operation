'use strict'

const util = require("../data-center/utility.js");
let errorCount = 0;

start();

async function start(){
    const targetDate = ['2022-09-11','2022-09-12','2022-09-13','2022-09-14','2022-09-15','2022-09-16','2022-09-17','2022-09-18','2022-09-19','2022-09-20'];
    for(let i = 0; i < targetDate.length; i++) {
        const start1 = `${targetDate[i]} 00:00:00`;
        const end1 = `${targetDate[i]} 11:59:59`;
        const start2 = `${targetDate[i]} 12:00:00`;
        const end2 = `${targetDate[i]} 23:59:59`;
        
        const startDateArray = [start1, start2];
        const endDateArray = [end1, end2];
        const signal = await setOrderChannel(targetDate[i], startDateArray, endDateArray);
        await util.delayTime(2000);
        console.log(signal);
    }
}

async function setOrderChannel(targetDate, startDateArray, endDateArray) {
    const orderChannel = ["shop","naverpay"];
    const orderStatus = await util.sqlData(`
        SELECT order_status_code 
        FROM gododb.order_status 
        WHERE order_status_code NOT IN ('g2','g3','g4','f1','f2','f3','z1','z2','z3','z4','z5')`
    );

    for (let i = 0; i < orderChannel.length; i++) {
        for (let j = 0; j < orderStatus.length; j++) {
            for (let k = 0; k < startDateArray.length; k++) {
                const d = await getOrderData(orderChannel[i], orderStatus[j].order_status_code, startDateArray[k], endDateArray[k]);
                await util.delayTime(2000);
                console.log(d);
            }
            await util.delayTime(2000);
        }
        await util.delayTime(2000);
        return targetDate + " / " + orderChannel[i] + " update complete";
    }
}

async function getOrderData(channel, status, startDate, endDate) {

    const paramDetail = util.param.main_key + "&" + util.lib.qs.stringify( {
        dateType: 'order', 
        startDate: startDate, 
        endDate: endDate, 
        orderChannel: channel,
        orderStatus: status } );

    const options = { method: 'POST',
        url: `${util.param.main_url}/order/Order_Search.php?${paramDetail}`
    };

    const xmlRowData = await util.xmlData(options);
    const jsonData = await util.parseXml(xmlRowData);
    
    if(jsonData.data == undefined) {
        await util.delayTime(30000);
        errorCount++
        if( errorCount < 5 ) {
            getOrderData(channel, status,startDate, endDate)
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
                            Number(s.fixedPrice[0]), 
                            (Number(s.goodsPrice[0]) + Number(s.optionPrice[0])), 
                            Number(s.goodsDcPrice[0]), 
                            Number(s.goodsCnt[0]), 
                            orderData[i].memId == undefined ? null : orderData[i].memId[0],
                            s.orderStatus[0], 
                            s.commission[0] 
                        ] );

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
                    await util.delayTime(2000);
                }
                return channel + " / " + status + " / " + startDate + " update complete";
            }
        } else {
            return channel + " / " + status + " / " + startDate + " Error";
        }
        return channel + " / " + status + " / " + startDate + " No Data";
    }
}