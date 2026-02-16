require('dotenv').config({ path: './.env' });

token = process.env.INFLUX_TOKEN;;

console.log(token);