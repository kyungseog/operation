'use strict'

const { DateTime } = require("luxon");
const util = require("../data-center/utility.js");

const rule = new util.lib.schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule.hour = 7;
rule.minute = 30;

util.lib.schedule.scheduleJob( "getEstimateTemperature", rule, () => estimateTemperature() );

async function estimateTemperature() {
  const targetDate = DateTime.now().toFormat('yyyyLLdd') + "0600";

  const temperatureParam = util.lib.qs.stringify({
    serviceKey: util.param.weather_key, 
    numOfRows: 100, 
    dataType: 'JSON', 
    tmFc: targetDate,
    regId: '11B10101'
  });

  const rainParam = util.lib.qs.stringify({
    serviceKey: util.param.weather_key, 
    numOfRows: 100, 
    dataType: 'JSON', 
    tmFc: targetDate,
    regId: '11B00000'
  });
  
  const temperatureOptions = { 
    method: 'GET',
    url: `http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa?${temperatureParam}`
  };

  const rainOptions = { 
    method: 'GET',
    url: `http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst?${rainParam}`
  };
  
  const tempData = await util.requestData(temperatureOptions);
  const rainData = await util.requestData(rainOptions);
  const tempArray = tempData.response.body.items.item;
  const rainArray = rainData.response.body.items.item;

  let uploadData = [
    ['KR', '서울', DateTime.now().plus({days: 3}).toFormat('yyyy-LL-dd'), tempArray[0].taMin3, tempArray[0].taMax3, rainArray[0].rnSt3Am, rainArray[0].rnSt3Pm],
    ['KR', '서울', DateTime.now().plus({days: 4}).toFormat('yyyy-LL-dd'), tempArray[0].taMin4, tempArray[0].taMax4, rainArray[0].rnSt4Am, rainArray[0].rnSt4Pm],
    ['KR', '서울', DateTime.now().plus({days: 5}).toFormat('yyyy-LL-dd'), tempArray[0].taMin5, tempArray[0].taMax5, rainArray[0].rnSt5Am, rainArray[0].rnSt5Pm],
    ['KR', '서울', DateTime.now().plus({days: 6}).toFormat('yyyy-LL-dd'), tempArray[0].taMin6, tempArray[0].taMax6, rainArray[0].rnSt6Am, rainArray[0].rnSt6Pm],
    ['KR', '서울', DateTime.now().plus({days: 7}).toFormat('yyyy-LL-dd'), tempArray[0].taMin7, tempArray[0].taMax7, rainArray[0].rnSt7Am, rainArray[0].rnSt7Pm],
  ];
  
  const sql = `
    INSERT INTO apidb.api_weatherdata
      (country
      , city
      , date
      , temperature_min
      , temperature_max
      , estimate_am
      , estimate_pm) 
    VALUES ?
    ON DUPLICATE KEY UPDATE 
      temperature_min=values(temperature_min)
      , temperature_max=values(temperature_max)
      , estimate_am=values(estimate_am)
      , estimate_pm=values(estimate_pm)`;
  
  util.param.db.query(sql, [uploadData], function(error, result) {
    error ? console.log(error) : console.log('update actualData');
  });
};
