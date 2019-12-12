'use strict';
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var Block = require("./block")


module.exports = class Textract{
    /**
     * Creates a Textract object with a given set of credential information as positional arguments.
     * 
     * @param {string} accessKeyId - The AWS access key ID.
     * @param {string} secretAccessKey - The AWS secret access key.
     * @param {string} sessionToken - The optional AWS session token.
     */
    constructor(accessKeyId,secretAccessKey,sessionToken = "",region="us-west-2"){
        AWS.config.region = region;
        AWS.config.credentials = new AWS.Credentials(accessKeyId,secretAccessKey,sessionToken)
        this.textract = new AWS.Textract();
        this.bucket = "";
        this.blocks = []
        this.pages = []
        this.name = ""
    }
    
    /**
     * This method analyze a doc by async way, given a name of file in 
     * the specified bucket
     * 
     * @param {string} name - the name of file in bucket to analyze (by default, the previous document analyzed if there was)
     * @returns {Promise}
     */
    async analizeDocumentAsync(name = this.name){
        this.name = name
        var params = {
            DocumentLocation: { /* required */
              S3Object: {
                Bucket: this.bucket,
                Name: name
              }
            },
            FeatureTypes: ["FORMS","TABLES"],
            /*
            NotificationChannel: {
                RoleArn: 'arn:aws:iam::19250632xxxx:role/AWSTextractRole', 
                SNSTopicArn: 'arn:aws:sns:us-east-1:19250632xxxx:AmazonTextractTopic1562662993926'
              }
            */
        };
        return new Promise((resolve,reject)=>{
            this.textract.startDocumentAnalysis(params,function(err,data){
                if (err){
                    console.log(err, err.stack); 
                    reject(err);
                } 
                resolve(data);    
            })
        })
        
    }

    /**
     * Get document analyzed given a job id
     * 
     * @param {string} jobId - the jobId that analizeDocumentAsync returns
     * @param {number} MaxResults - number of results you want to get
     * @param {string} NextToken - (optional) token to get the next segment of data
     */
    async getDocumentAnalyzed(jobId,MaxResults = 1000,NextToken){
        
        var params = (NextToken != null) ? {
            JobId: jobId, 
            MaxResults: MaxResults,
            NextToken: NextToken
        } : {
            JobId: jobId, 
            MaxResults: MaxResults
        };
        
        return new Promise((resolve,reject)=>{
            this.textract.getDocumentAnalysis(params,function(err,data){
                if (err){
                    console.log(err, err.stack); 
                    reject(err);
                } 
                resolve(data);     
            })
        });
    }
    
    /**
     * Get document data recursively, from all pages of document
     * you can store this data in a mongo database to make relationships
     * properly and faster (use TextractParser object to parse data and/or store)
     * 
     * @param {String} jobId // the jobId of document analyzed async
     * @param {Number} MaxResults // max number of results to get
     * @param {String} NextToken (optional) the token to get the next data set of document
    */
    async getDocumentAnalyzedRecursively(jobId,maxResults = 1000,nextToken = null){
        //  IN_PROGRESS | SUCCEEDED | FAILED | PARTIAL_SUCCESS
        let r = await this.getDocumentAnalyzed(jobId,maxResults,nextToken)
        
        if(r.JobStatus == "IN_PROGRESS"){
            return {status:"IN_PROGRESS",analyzed:false,blocks:[]};
        }
        
        this.fillPages(r)
        if(r.NextToken){
            return await this.getDocumentAnalyzedRecursively(jobId,maxResults,r.NextToken)
        }else{  
            return {status:r.JobStatus,analyzed:true,blocks:this.blocks} 
        }
        
    }
    
    
    fillPages(data){
        data.Blocks.forEach(element => {
            this.blocks.push(element)
            let page = (data.DocumentMetadata.Pages == 1)?1:element.Page
            if( typeof this.pages[page - 1] === 'undefined'){
                this.pages[page -1] = []
                this.pages[page -1].push(element)
            }else{
                this.pages[page -1].push(element)
            }
             
        });
    }


    /**
     * This method analyze documents just in JPG or PNG
     * this because do this in a sync way.
     * @param {string} name - name of file in bucket that is going to be analyzed
     */
    async analizeDocument(name){
        var params = {
            Document: { /* required */
              S3Object: {
                Bucket: this.bucket,
                Name: name
              }
            },
            FeatureTypes: ["TABLES","FORMS"],
            /*
            NotificationChannel: {
                RoleArn: 'arn:aws:iam::19250632xxxx:role/AWSTextractRole', 
                SNSTopicArn: 'arn:aws:sns:us-east-1:19250632xxxx:AmazonTextractTopic1562662993926'
              }
            */
        };
        return new Promise((resolve,reject)=>{
            
            this.textract.analyzeDocument(params,(err, data) => {
                if (err){
                    console.log(err, err.stack); 
                    reject(err);
                } 
                
                this.fillPages(data);
                resolve(data);
                
            });
        });
    }

}



