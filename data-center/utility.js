'use strict'

const request = require("request");
const { App } = require("@slack/bolt");
const { parseString } = require("xml2js");
const mysql = require('mysql2');
const path = require('path');
const dotenv = require("dotenv");
const schedule = require('node-schedule');
const qs = require('querystring');
const { DateTime } = require("luxon");

dotenv.config({path: path.join(__dirname, '/.env')});
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 1500
  });

const main_url = 'https://openhub.godo.co.kr/godomall5';
const main_key = `partner_key=${process.env.PARTNER_KEY}&key=${process.env.KEY}`;
const weather_key = process.env.MY_SERVICE_KEY;

const originData = {
    KR: '한국', 
    JP: '일본', 
    US: '미국', 
    VE: '베트남', 
    CN: '중국', 
    ID: '인도네시아', 
    IN: '인도', 
    MY: '말레이시아'
};

const sheetIds = {
    koreaSheetId: process.env.KOREA_SHEET_ID,
    japanSheetId: process.env.JAPAN_SHEET_ID,
    marketingSheetId: process.env.MARKETING_SHEET_ID
};

module.exports.slackApp = new App({
    token: process.env.TOKEN,
    signingSecret: process.env.SIGNINGSECRET 
  });

module.exports.delayTime = ms => new Promise(res => setTimeout(res,ms));

module.exports.requestData = function requestData(options) {
    return new Promise( (resolve, reject) => {
        request(options, (err, response, result) => {
            return err ? reject(err) : resolve(result);
        });
    });
}

module.exports.parseXml = function parseXml(xml) {
    return new Promise( (resolve, reject) => {
        parseString(xml, (err, result) => {
            return err ? reject(err) : resolve(result);
        });
    });
}

module.exports.sqlData = function sqlData(query, data) {
    return new Promise((resolve, reject) => {
      db.query(query, data, (err, result) => {
          return err ? reject(err) : resolve(result);
      });
    });
  }

module.exports.param = {
    main_url,
    main_key,
    db,
    weather_key
}

module.exports.lib = {
    schedule,
    qs,
    DateTime,
    today,
    originData,
    sheetIds
}
