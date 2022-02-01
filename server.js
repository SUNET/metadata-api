/*

start server: node server.js

Example request: curl --request GET http://<server_hostname>:4000/status

*/
const version = "0.4.4"; //used for status answer

const http = require('http');
const https = require('https');
const express = require('express');
const app = express();
const fs = require('fs')
const s3_obj = require('./class_s3.js');
const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;
const CryptoJS = require("crypto-js");
const jwt  = require('jsonwebtoken');
require('dotenv').config();

//Controls from environment
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 4000;
const BACKEND = process.env.STORAGE || "S3";
const PUSH = process.env.PUSH || "0";
const ALLOW_OBJECTLIST = process.env.ALLOW_OBJECTLIST || "1";
const RATE_LIMIT = process.env.RATE_LIMIT || 100; 
const ALLOW_LOCK = process.env.ALLOW_LOCK || false;
const LOGGING = process.env.ALLOW_LOGGING || false;

//Data for JWT-token generation & verification
const AMOUNT_TOKENS = process.env.AMOUNT_TOKENS || "5"; //Define how many tokens to generate, default is 5
const ISSUER = process.env.ISSUER || 'sapi-default-creator';
const SUBJECT = process.env.SUBJECT || 'sapi-default-subject';
const AUDIENCE = process.env.AUDIENCE || 'sapi-default-api-audience';
const ENDPOINT = process.env.ENDPOINT || 'sapi-default-endpoint';
const PRIVATE_TOKEN_CERT = process.env.PRIVATE_TOKEN_CERT;
const PUBLIC_TOKEN_CERT = process.env.PUBLIC_TOKEN_CERT;

//Setting up logging
if(LOGGING == true){
  logger.info('starting api server')
}

//JWT-token Creation
if(AMOUNT_TOKENS > 0 ){
  var privateKEY  = fs.readFileSync(PRIVATE_TOKEN_CERT, 'utf8');
  var publicKEY  = fs.readFileSync(PUBLIC_TOKEN_CERT, 'utf8');
  
  //JWT Properties
  var signOptions = {
    issuer:  ISSUER,
    subject:  SUBJECT,
    audience:  AUDIENCE,
    expiresIn:  "365d",
    algorithm:  "ES512"
    };

  var payload = {
    data1: "Token for API endpoint",
    endpoint: ENDPOINT
  };

  let tokens = {};

  for(i =0; i<=AMOUNT_TOKENS; i++){
    tokens[i] = jwt.sign(payload, privateKEY, signOptions);  
  }
  logger.info('created ' + AMOUNT_TOKENS + ' tokens saving to tokens.json');
    
  let data = JSON.stringify(tokens);
  fs.writeFileSync('tokens.json', data); //save tokens to file
}

app.use(express.json());

//Backend Storage Selector based on environment
  /*if(BACKEND == "S3"){
    console.log("S3 backend selected");
    let storageObject = new s3_obj();
  }
  else if(BACKEND == "LOCAL") {
    console.log("LOCAL backend selected");
    let storageObject = new localObject();
  }
*/

const rateLimit = require("express-rate-limit");
 
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);
 
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
 
//apply ratelimit to all requests
app.use(limiter);

let storageObject = new s3_obj(ALLOW_OBJECTLIST);

if(PUSH == "1"){
  storageObject.updateIndex(req, res);
  logger.info("push to index enabled");
}

app.use('/status', function (req, res) {
  res.status(200).json({ 'Version ': ' '+ version });
  logger.info("sending status");
});

app.use('/getIndexInfo', verifyToken, function (req, res) {
  storageObject.getIndexInfo (req, res);
});

app.use('/updateIndex', verifyToken, function (req, res) {
  storageObject.updateIndex(req, res);
});

app.use('/getMetadata', verifyToken, function (req, res) {
  storageObject.getMetadata(req,res);
});

app.use('/getManifest', function (req, res) {
  if(req.key.startsWith(metadata))
  storageObject.getMetadata(req,res);
});

app.use('/getObjectList', verifyToken, function (req, res) {
  storageObject.getObjectList(req,res);
});

app.put('/updateMetadata', verifyToken, function (req, res) {
  storageObject.updateMetadata(req,res);
});

app.put('/lockObject', verifyToken, function (req, res) {
  if(ALLOW_LOCK)
    storageObject.lockObject(req,res);
  else
    res.send("Object lock now allowed on this endpoint");
});

app.put('/setPermission', verifyToken, function (req, res) {
  storageObject.createLink(req,res);
});

app.put('/createLink', verifyToken, function (req, res) {
  storageObject.createLink(req,res);
});

app.delete('/removeLink', verifyToken, function (req, res) {
  storageObject.setPermissions(req,res);
});

app.put('/publishObject', verifyToken, function (req, res) {
  storageObject.setPermissions(req,res);
});

app.put('/archiveObject', verifyToken, function (req, res) {
  storageObject.setPermissions(req,res);
});

// Middleware function to verify token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization']; // Get auth header value
  if(typeof bearerHeader !== 'undefined') { // Check if bearer is undefined
    const bearer = bearerHeader.split(' '); // Split at the space
    const bearerToken = bearer[1]; // Get token from array

    jwt.verify(bearerToken, publicKEY, function(err, decoded) {
      console.log("token was received and verified");
      next(); // Next function
    });

  } else {
    res.sendStatus(403); // Forbidden
  }
} 

//Use cert if available
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
