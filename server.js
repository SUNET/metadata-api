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

//api calls for GET "/local" "/s3" "/"
app.use('/local', localRouter);   
app.use('/s3', s3Router);

//api calls for POST
app.post('/local', localRouter);   

//Catch if user doesn't request anything
app.use('/', function(req, res) {
    res.send('API works! Usage: /local, /s3');
});

const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('API Server listening on port ' + port);
