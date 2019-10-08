/*
Route to fetch metadata from local storage
*/

const express = require('express');
const router = express.Router();
const fs = require('fs')
var bodyParser = require('body-parser')

router.get('/', function (req, res) {
    fs.readFile('./metadata.jsonld', 'utf8', (err, jsonString) => {
        if (err) {
            console.log("Error reading file from disk:", err)
            return
        }
        try {
            const metadata = JSON.parse(jsonString)
            res.status(200).json(metadata);
        } catch(err) {
            console.log('Error parsing JSON string:', err)
        }
    })
});

module.exports = router;