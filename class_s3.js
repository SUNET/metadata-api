class s3_obj {
    constructor() {
        let self = this;
        var AWS = require('aws-sdk');
        AWS.config.loadFromPath('aws_config.json');

        self.s3 = new AWS.S3();
        self.s3.config.s3ForcePathStyle=true;
        self.params = {
            Bucket: "placeholder-bucket", 
        }; 
        //self.dataToRegister = new Array();
    }

    updateIndex(req, res){
        let self = this;
        //let params = {}; //null params  
        self.dataToRegister = new Array();
        this.refreshInventory(req,res);
    }

    getIndexInfo(req, res){
        let self = this;
        res.status(200).json(self.dataToRegister);
    }
    getManifest(req,res){
        let params = {
            Bucket: "placeholderBucket", 
            Key: "placeholderKey",
        }; 
        if(req.query.bucket)
            params.Bucket = req.query.bucket;
        else
            res.status(400).send("error, no bucket provided in request");

        //Same function as getMetadata but locked key in this
        params.Key = ".metadata/manifest.jsonld";
        
        this.s3.getObject(params, function(err, data)
            {
                if (!err){
                console.log(data.Body.toString());
                let jsonObject = JSON.parse(data.Body.toString()); 
                res.status(200).json(jsonObject);
                }
                else{
                    res.status(200);
                    console.log(err); //DEBUG PURPOSES
                }     
            }).on("httpDone", function(response){ //DEBUG PURPOSES
            });
    }

    getMetadata(req,res){
        let params = {
            Bucket: "placeholderBucket", 
            Key: "placeholderKey",
        }; 
        if(req.query.bucket)
            params.Bucket = req.query.bucket;
        else
            res.status(400).send("error, no bucket provided in request");

        if(req.query.key)
            params.Key = req.query.key;
        else
            params.Key = ".metadata/manifest.jsonld";
        
        this.s3.getObject(params, function(err, data)
            {
                if (!err){
                console.log(data.Body.toString());
                let jsonObject = JSON.parse(data.Body.toString()); 
                res.status(200).json(jsonObject);
                }
                else{
                    res.status(200);
                    console.log(err); //DEBUG PURPOSES
                }     
            }).on("httpDone", function(response){ //DEBUG PURPOSES
            });
    }
    lockObject(req,res){
        //if ok setImmutableObject
        res.status(200).send("objectLock OK"); 

        //else res.status(200).send("objectLock FAIL"); 
    }
    updateMetadata(req,res){
        let self = this;

        let uploadParams = {
            Bucket: "placeholderBucket", 
            Key: "placeholderKey",
            Body: "placeholderBody"
        }; 
    
        if(req.query.bucket)
            uploadParams.Bucket = req.query.bucket;
        else
            res.status(400).send("error, no bucket provided in request");

        if(req.query.key)
            uploadParams.Key = req.query.key;
        else
            uploadParams.Key = ".metadata/manifest.jsonld";
   
        uploadParams.Body = req.body;
        
        self.saveObject(uploadParams.Body,uploadParams.Bucket,uploadParams.Key);
           
        res.status(200).json(uploadParams.Body); 
    }

    setPermissions(req,res){
        let params = {}; 

        if (req.query.bucket)        
            params.Bucket = req.query.bucket;
        else res.status(400).send("error, no bucket provided in request");
        
        if (req.query.key)        
            params.Key = req.query.key;
    
        if (req.query.ACL)  
            params.ACL = req.query.ACL;
        else
            params.ACL = "private";

        this.s3.putObjectAcl(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     
                console.log(data);           // successful response
        }); 

        //Initialize parameters 
        let params2 = {
            Bucket: req.query.bucket,
            Key: req.query.key
        }; 
        this.s3.getObjectAcl(params2, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else{
                console.log(data);           // successful response
            }   
        }); 
        res.status(200).send("set permissions ok");
    }

    getObjectList(req,res, CryptoJS){
        let self = this;
        let params = {};
        if (req.query.bucket)        
            params.Bucket = req.query.bucket;
        else res.status(400).send("error, no bucket provided in request");
              
            //Function to check how old the file is:
            params.Key = ".metadata/objects.json";
            var old = self.s3.headObject(params, function (error, response) {
                if(error) {
                    console.log(error);
                    res.status(200).send("Objectlist not found"); 
                } else {
                    var date = response.LastModified; //Last modified date
                    var d1 = new Date();
                    var diff = d1-date;

                    if((diff/1000)/60 > 5){ //list is old create new
                        return true; 
                    }
                    else{ //new don't refresh
                        return false; 
                    }
                }
            });
        
        //TODO return error if unable to save
        delete params.Key; //Remove key used when checking age of objectlist
        if(req.query.generate==1 && self.ALLOW_OBJECTLIST == 1 || old && self.ALLOW_OBJECTLIST == 1 ){
            this.s3.listObjects(params, function(err, data,) {
                if (err) {
                    console.log("Error from listObjects function", err);
                }
                else {
                    var newObject = new Array();
                    const metadata = data.Contents;
                    
                    //Strip from unwanted values
                    for (var key in metadata) {
                        const selectedProperties = self.selectSomeProperties(metadata[key]);
                        newObject.push(selectedProperties);     
                    }
                
                    //Create url for each object
                    newObject.forEach(function (item, index){
                        newObject[index].Url = self.s3.config.endpoint + "/" + params.Bucket + "/" + newObject[index].Key;
                        newObject[index].SHA256Hash = 0;
                        
                        //newObject[index].SHA256Hash = self.makeHash(req, newObject[index].Key,CryptoJS); //Call function to make hash
                    })

                    //Save new objectlist
                    params.Key = ".metadata/objects.json";
                    self.saveObject(newObject,params.Bucket,params.Key);
                    
                    res.status(200).send(newObject); 
                }
            });
        }
        
        else { 
            //Fetch objectlist from file

            params.Key = ".metadata/objects.json";

            self.s3.getObject(params, function(err, data)
            {
                if (!err){
                    let jsonObject = JSON.parse(data.Body.toString());
                    res.status(200).json(jsonObject);
                }
                else{
                    res.status(404);
                    console.log(err); 
                }     
            }).on("httpDone", function(response){ 
                //DEBUG PURPOSES
            });
        }
    }
    
    //createLink Function to create link and make object public-read
    createLink(req, res) {
        let self = this;
        let params = {};
        if (req.query.bucket)        
            params.Bucket = req.query.bucket;
        else res.status(400).send("error, no bucket provided in request");

        if (req.query.key){
            params.Key = req.query.key;
        }    
        else res.status(400).send("error, no key provided in request");          

        let link = this.s3.config.endpoint + "/" + params.Bucket + "/" + params.Key;

        res.status(200).send(link);
        
        params.ACL = "public-read";
        
        self.s3.putObjectAcl(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                res.status(403).send("Unable to create link");
            }
            else     console.log(data);           // successful response
        });
    }

   //removeLink 
    removeLink(req, res) {
        let self = this;
        let params = {};
        if (req.query.bucket) //remove if we want on bucket level        
            params.Bucket = req.query.bucket;
        else res.status(400).send("error, no bucket provided in request");
        
        if (req.query.key)        
            params.Key = req.query.key;
        else res.status(400).send("error, no key provided in request");
    
        params.ACL = "private";
        self.s3.putObjectAcl(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            //else     //console.log(data);           // successful response
        }); 
        res.status(200).send("removeLink OK\n");
    }
   
    refreshInventory(req, res){
        let self = this;
        let params = {};
            self.s3.listBuckets(params, function(err, data) {
                if (err) console.log(err, err.stack); 
                else{
                    data.Buckets.forEach(element => {
                        console.log(process.env.SELF_IP);
                        let registerName = process.env.SELF_IP + "/getManifest?bucket=" + element.Name; //Create useful link
                        self.dataToRegister.push(registerName); // store for future reference
                        self.pushInventory(req, res, registerName); //push to index
                    });
                    
                }
            });
          res.status(200).json("refresh done");
    }

    pushInventory(req, res, dataToPush){
        const axios = require('axios');
        let self = this;
        let indexURL = process.env.INDEX; //+'/api/register';
        if(req.query.push == 1 ){
            axios({
                method: 'post',
                url: indexURL,
                data: dataToPush,
            }).catch(thrown => {
                if (axios.isCancel(thrown)) {
                    console.log(thrown.message);
                    res.status(500).json("unable to push to index");
                } else {
                    console.log("pushed " + dataToPush);
                }
            });
        }
    }

    //Function to select specific properties from object
    selectSomeProperties(raw) {
    return Object.keys(raw).reduce(function(obj, k) {
        if (["Key", "LastModified", "ETag", "Size"].includes(k)) {
            obj[k] = raw[k];
        }
        return obj;
        }, {});
    }

    //Function to save to s3 storage (Default use case is for objectlist)
    saveObject(inputData,targetBucket,targetKey){
        console.log("Saving data");

        let uploadParams = {
            Bucket: targetBucket,
            Key: ".metadata/objects.json",
            Body: JSON.stringify(inputData)
            //ContentType: 'application/json; charset=utf-8'
        };

        //console.log(targetBucket);

        if(targetKey){
            uploadParams.Key = targetKey;
        }
        
        this.s3.putObject(uploadParams,
            function (err,data) {
            console.log(JSON.stringify(err) + " " + JSON.stringify(data));
            }
        );
    }

    //Dummy Function to hash object
    makeHash(req, metadata,CryptoJS){
        let self = this;
        let params = {};
        if (req.query.bucket)        
            params.Bucket = req.query.bucket;
        else res.status(400).send("error, no bucket provided in request");

        params.Key = metadata;

        return (0);
    }
}


module.exports = s3_obj