"use strict";

var request = require('request');

var error = require('../services/error');

class AzureADFSService {
    constructor() {
        this.loginUrl = 'https://login.microsoftonline.com/';
        this.graphUrl = 'https://graph.microsoft.com/v1.0/';
        this.tenant = 'Vivaaerobus.onmicrosoft.com';
        this.headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        this.data = [
            'grant_type=client_credentials',
            'client_id=92b14d62-12de-417b-9363-b9f0f0bc8619',
            'client_secret=8mkTyS99ArkCOs6gnbInxwhx8At9339cXOXPzkJfMfA=',
            'scope=https://graph.microsoft.com/.default'
        ].join('&');
        this.tokenUrl = this.loginUrl + this.tenant + '/oauth2/v2.0/token';
    }

    getAccessToken(fn) {
    
        var options = {
            url: this.tokenUrl,
            method: 'POST',
            headers: this.headers,
            body: this.data,
        };

        request(options, (err, response, body) => {
            if (err) {
                console.log(err)
                fn(error.error12);
            } else {
                this.accessTokenData = response;
                fn({status: 1,  msg: 'Exito' });
            }
        });
    }
    
    connectToGraph(query, fn) {
        //["users",token]
      if (this.accessTokenData) {
          var url = this.graphUrl + query.join('/');
          var accesTokenBody = JSON.parse(this.accessTokenData.body)
          var authToken = accesTokenBody.token_type + ' ' + accesTokenBody.access_token;
          var headers = {
            Authorization: authToken,
            Accept: 'application/json'
          };

          var options = {
              url: url,
              method: 'GET',
              headers: headers,
          };

          request(options, (err, response, body) => {
              if (err) {
                  console.log(err);
                  fn(error.error12);
              } else {
                  fn(response);
              }
          });
      } else {
        fn(error.error13);
      }
    }
}

var azureADFSService = new AzureADFSService();

module.exports = azureADFSService;
