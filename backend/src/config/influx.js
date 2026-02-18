const { InfluxDB } = require('@influxdata/influxdb-client');


const influxClient = new InfluxDB({
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
});

console.log('Client created:', typeof influxClient);
console.log('getQueryApi exists:', typeof influxClient.getQueryApi);

const queryApi = influxClient.getQueryApi(process.env.INFLUX_ORG);

console.log('queryApi:', typeof queryApi);
console.log('queryApi.queryRows:', typeof queryApi?.queryRows);
console.log('--------------------------------------');

module.exports = { influxClient, queryApi };