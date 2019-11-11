/*

start server: node server.js

Example request: curl --request GET http://<server_hostname>:3000/s3
*/

const http = require('http');
const https = require('https');
const express = require('express');
const localRouter = require('./routes/local');
const s3Router = require('./routes/s3');

const app = express();
app.use(express.json());

require('dotenv').config(); //aquire local config

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;

//api calls for GET "/local" "/s3" "/"
app.use('/local', localRouter);   
app.use('/s3', s3Router);

//api calls for POST
app.post('/local', localRouter);   

//Catch if user doesn't request anything
app.use('/', function(req, res) {
    res.send('API works! Usage: /local, /s3');
});

if (process.env.SSL_KEY && process.env.SSL_CERT) {
    let options = {
        'key': fs.readFileSync(process.env.SSL_KEY),
        'cert': fs.readFileSync(process.env.SSL_CERT)
    };
    https.createServer(options, app).listen(PORT, function () {
        console.log(`HTTPS listening on ${HOST}:${PORT}`);
    });
  } else {
    http.createServer(app).listen(PORT, function () {
        console.log(`HTTP listening on ${HOST}:${PORT}`);
    })
  }
  