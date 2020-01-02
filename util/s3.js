var AWS = require('aws-sdk');
var s3 = new AWS.S3();


module.exports = class S3{
    
    constructor(accessKeyId,secretAccessKey, sessionToken = "", region='us-west-2'){
        AWS.config.region = region;
        AWS.config.signatureVersion = 'v4'
        AWS.config.credentials = new AWS.Credentials(accessKeyId,secretAccessKey,sessionToken)
        this.s3 = new AWS.S3({signatureVersion: 'v4'});
        this.bucket = "";
    }
    
    /**
     * Uploads a file in aws S3 bucket given a key file and the data
     * of the body
     * 
     * @param {String} key the key of file that will be uploaded 
     * @param {*} body the data of file to upload
     */
    async uploadFile(key,body){

        var params = {Bucket: this.bucket, Key: key, Body:body};
        
        return s3.putObject(params).promise()
        .then(data=>{
            console.log(data)
            console.log("Successfully uploaded data");
            return {message:"Successfully uploaded",status:200}
        })
        .catch(err=>{
            console.log(err)
            return {message:"Bad uploaded",status:400}
        });
        
    }
    
    /**
     * Copy a file from a source to destination given
     * the source key and destination key
     * 
     * @param {String} source the source file key 
     * @param {String} key the destination file key
     * @param {String} sourceBucket (optional) the source bucket of file (by default the given to attribute 'bucket', also pass null to use default) 
     * @param {String} destinationBucket (optional) the destination bucket of copied file (by default the given to attribute 'bucket', also pass null to use default)
     */
    async copyFile(source,key,sourceBucket = this.bucket, destinationBucket = this.bucket){
        if(sourceBucket == null) sourceBucket = this.bucket;
        if(destinationBucket == null) destinationBucket = this.bucket;

        var params = {
            Bucket : destinationBucket, /* Another bucket working fine */ 
            CopySource : sourceBucket+"/"+source, /* required */
            Key : key, /* required */
            //ACL : 'public-read',
        };
        return s3.copyObject(params).promise()
        .then(data=>{
            console.log(data)
            console.log("Successfully copied data");
            return {message:"Successfully copied",status:200}
        })
        .catch(err=>{
            console.log(err)
            return {message:"Bad copied",status:400}
        });

    }
    
    /**
     * Delete a file in bucket given a file key
     * 
     * @param {String} key the file's key that going to be deleted
     */
    async deleteFile(key){
        var params = {  Bucket: this.bucket, Key: key };
        return s3.deleteObject(params).promise()
        .then(data=>{
            console.log("Successfully deleted file");
            return data
        })
        .catch(err=>{
            console.log(err)
            return null
        });
    }
    
    /**
     * Get a signed url to get a protected file in S3 bucket
     * given a key file, it expires in 300 sec
     * 
     * @param {String} key 
     */
    async getUrlObject(key,bucket = this.bucket){
        var params = {Bucket: bucket, Key: key , Expires: 300/*, ACL: 'public-read'*/};
        return new Promise((resolve,reject)=>{
            s3.getSignedUrl('getObject', params, function (err, url) {
                if(err) return reject(err);
                else resolve(url);  
            });
        });
    }
    
    /**
     * Get a signed url to get a protected file in S3 bucket
     * given a key file, it expires in 300 sec
     * 
     * @param {String} key 
     */
    async getObject(key,bucket = this.bucket){
        var params = {Bucket: bucket, Key: key};
        return new Promise((resolve,reject)=>{
            s3.getObject(params, function (err, data) {
                if(err) return reject(err);
                else resolve(data);  
            });
        });
    }

    /**
     * Create a bucket given the bucket name
     * 
     * @param {String} bucket the name of bucket that will be created
     */
    createBucket(bucket){
        
        return new Promise((resolve,reject)=>{
            s3.createBucket({Bucket:bucket}, function(err, data) {

                if (err) {
                   console.log(err);
                   reject(err)
                } else {
                    resolve(data)
                }
            });
        });

    }

    /**
     * Lists the files and subfolders of a given folder
     * optionally given a bucket (this default bucket is bucket passed by attribute and stored in instance bucket attribute)
     * 
     * @param {String} folder name of folder to list files and subfolders
     * @param {String} bucket (optional) name of bucket where will get folders
     */
    async filesFromFolder(folder,bucket = this.bucket){
        var params = (folder == "/")? {
            Bucket: bucket,
            Delimiter: '/'
        }:{
            Bucket: bucket,
            Prefix: folder
        };
        
        return s3.listObjectsV2(params).promise()
        .then(data=>{
            return data
        })
        .catch(err=>{
            console.log(err)
            return null
        });
    }



}
