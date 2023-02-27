'use strict'

const { DateTime } = require("luxon");
const util = require("../data-center/utility.js");

// const rule = new util.lib.schedule.RecurrenceRule();
// rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
// rule.hour = 7;
// rule.minute = 0;

// util.lib.schedule.scheduleJob( "getActualWeather", rule, () => actualWeather() );
actualWeather();
async function actualWeather() {
  const targetDate = DateTime.now().minus({days: 1}).toFormat('yyyyLLdd');
console.log(util.param.weather_key)
  const paramDetail = util.lib.qs.stringify({
    numOfRows: 100, 
    dataType: 'JSON', 
    dataCd: 'ASOS',
    dateCd: 'DAY',
    startDt: targetDate,
    endDt: targetDate,
    stnIds: 108
  });
  
  const options = { 
    method: 'GET',
    url: `http://apis.data.go.kr/1360000/AsosDalyInfoService/getWthrDataList?serviceKey=${util.param.weather_key}&${paramDetail}`
  };
  
  const actualData = await util.requestData(options);
  const jsonData = await JSON.parse(actualData);
  let actualArray = jsonData.response.body.items.item;
  let uploadData = actualArray.map(u => ['KR', 'seoul', u.tm, u.minTa, u.maxTa, 0, 0, u.sumRn, u.ddMes]);
  
  const sql = `
    INSERT INTO management.weather
      (country
      , city
      , date
      , temperature_min
      , temperature_max
      , estimate_am
      , estimate_pm
      , rain
      , snow) 
    VALUES ?
    ON DUPLICATE KEY UPDATE 
      temperature_min=values(temperature_min)
      , temperature_max=values(temperature_max)
      , estimate_am = estimate_am
      , estimate_pm = estimate_pm
      , rain=values(rain)
      , snow=values(snow)`;
  
  util.param.db.query(sql, [uploadData], function(error, result) {
    error ? console.log(error) : console.log('update actualData');
  });
};
