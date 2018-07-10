'use strict';

const config = require('./config');

// Configure AWS and connect to DynamoDB
const AWS = require("aws-sdk");
AWS.config.update(config.aws);
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Create Express app
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const uuidv1 = require('uuid/v1');
const got = require('got');
const extractor = require('unfluff');

// Return list of recipes
app.get('/', (req, res) => {
    dynamoDb.scan({ TableName: config.db.tableName }).promise()
        .then(response => res.json(response.Items))
        .catch(error => {
            res.status(500).json({error: `Could not load recipes: ${error}`});
        });
});

// Create new recipe from URL
app.post('/', (req, res) => {
    const url = req.body.url;
    if (!url) {
        res.status(400).json({error: `Need to define 'url' POST parameter`});
        return;
    }

    got(url).then(response => {
        const body = response.body;
        // Extract text content from HTML
        var urlData = extractor(body);

        // Assign UUID to store recipe (uuid is the DynamoDB primary key)
        urlData['uuid'] = uuidv1();

        // Store recipe
        dynamoDb.put({ TableName: config.db.tableName, Item: urlData }, (err, data) => {
            if (err) {
                res.status(500).json({error: `Failed to store recipe: ${err}`});
            } else {
                res.json(urlData);
            }
        })

    }).catch(error => {
        res.status(400).json({error: `GET ${url} returned HTTP status code ${error.statusCode}`});
    });
});

module.exports = app;
