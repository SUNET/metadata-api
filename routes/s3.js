/*
Route to fetch metadata from s3 storage
*/

const express = require('express');
const router = express.Router();
const fs = require('fs')
require('dotenv').config();

// Create AWS object
var AWS = require('aws-sdk');

//Load config from file
AWS.config.loadFromPath('./routes/aws_config.json');

router.get('/', function (req, res) {
    //Print out arguments to server
    console.log(req.params());

    // Create S3 service object
    var s3 = new AWS.S3();
    
    //Set parameters for aws-get-object
    var params = {
        Bucket: "<bucket-name-here>", 
        Key: ".metadata/metadata.jsonld"
    };  

    new AWS.S3().getObject(params, function(err, data)
        {
            if (!err){        
            console.log(data.Body.toString());
            let returnData = JSON.parse(data.Body.toString()); 
            res.status(200).json(returnData);
            }     
        });
});

//Function to write object to s3 storage
router.post('/upload', function (req, res) {
    // Create S3 service object
       var s3 = new AWS.S3();
       
       //Set default parameters for aws-get-object
       let uploadParams = {
           Bucket: "placeholderBucket", 
           Key: "placeholderKey",
           Body: "placeholderBody"
       }; 
   
       //Set parameters from env
       uploadParams.Bucket = process.env.Bucket;
       uploadParams.Key = process.env.uploadKey;
       uploadParams.Body = JSON.stringify(req.body, null, 2);
   
       s3.upload (uploadParams, function (err, data) {
           if (err) {
             console.log("Error", err);
           } if (data) {
             console.log("Upload Success", data.Location);
           }
         });
          
       res.status(200).json(uploadParams.Body); 
    });

//Function to list object from storage
router.get('/list', function (req, res) {
    
    // Create S3 service object
    var s3 = new AWS.S3();
    
    //Set parameters for aws-get-object
    let params2 = {
        Bucket: "bucket", 
    }; 

    params2.Bucket = process.env.Bucket;
    console.log(params2);
    
    new AWS.S3().listObjects(params2, function(err, data) {
        if (err) console.log(err, err.stack); 
        else{
            console.log(data);          
            res.status(200).json(data); 
        }   
        });
});

module.exports = router;