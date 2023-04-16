const { google } = require("googleapis");
const util = require("../data-center/utility.js");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const analyticsDataClient = new BetaAnalyticsDataClient();
// Runs a simple report.
async function runRealtimeReport() {
  const response = await analyticsDataClient.runRealtimeReport({
    property: `properties/${250906029}`,
    minuteRanges: [{ startMinutesAgo: 29 }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
  });

  console.log(response[0].rows);
  // response.rows.forEach((row) => {
  //   console.log(row.dimensionValues[0].value, row.metricValues[0].value);
  // });
}

runRealtimeReport();
