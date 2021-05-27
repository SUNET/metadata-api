/*

start server: node server.js

Example request: curl --request GET http://<server_hostname>:4000/status

*/
const version = "4.3"; //used for status answer

const http = require('http');
const https = require('https');
const express = require('express');
const app = express();
const fs = require('fs')
const s3_obj = require('./class_s3.js');
const JsonLdParser = require("jsonld-streaming-parser").JsonLdParser;

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 4000;
const BACKEND = process.env.STORAGE || "S3";
const PUSH = process.env.PUSH || "0"; //Define if push to index

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

let storageObject = new s3_obj();

if(PUSH == "1"){
  storageObject.updateIndex(req, res);
}

app.use('/status', function (req, res) {
  res.status(200).json("HelloWorld, version: " + version);
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
    console.log("HELLO!!!");
  storageObject.getMetadata(req,res);
});

app.use('/getObjectList', verifyToken, function (req, res) {
  storageObject.getObjectList(req,res);
});

app.put('/updateMetadata', verifyToken, function (req, res) {
  storageObject.updateMetadata(req,res);
});

app.put('/lockObject', verifyToken, function (req, res) {
  storageObject.createLink(req,res);
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

// Middleware function to verify token if token is correct
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization']; // Get auth header value
    if(typeof bearerHeader !== 'undefined') { // Check if bearer is undefined
      const bearer = bearerHeader.split(' '); // Split at the space
      const bearerToken = bearer[1]; // Get token from array
      req.token = bearerToken; // Set the token
      next(); // Next function
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
