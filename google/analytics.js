const { google } = require("googleapis");
const util = require("../data-center/utility.js");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const analyticsDataClient = new BetaAnalyticsDataClient();
// Runs a simple report.
async function runRealtimeReport() {
  const [response] = await analyticsDataClient.runRealtimeReport({
    property: `properties/${250906029}`,
    minuteRanges: [
      {
        name: "0-4 minutes ago",
        start_minutes_ago: 4,
      },
    ],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
  });

  console.log("Report result:");
  response.rows.forEach((row) => {
    console.log(row.dimensionValues[0], row.metricValues[0]);
  });
}

runRealtimeReport();
