/*
Route to fetch metadata from s3 storage
*/

const express = require('express');
const router = express.Router();

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

module.exports = router;