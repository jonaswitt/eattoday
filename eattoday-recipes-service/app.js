'use strict';

const config = require('./config');

// Configure AWS and connect to DynamoDB
const AWS = require("aws-sdk");
AWS.config.update(config.aws);

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();

// Create Express app
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const rawParser = bodyParser.raw({ limit: 20 * 1024 * 1024 });

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
app.post('/createFromUrl', urlencodedParser, (req, res) => {
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
        });

    }).catch(error => {
        res.status(400).json({error: `GET ${url} returned HTTP status code ${error.statusCode}`});
    });
});

// Create new recipe from an image
app.post('/createFromImage', rawParser, (req, res) => {
    // TODO: stream request body
    const imageData = req.body;
    if (!imageData) {
        res.status(400).json({error: `Need to define image data in POST body`});
        return;
    }
    var recipe = { uuid: uuidv1() };

    s3.putObject({ Body: imageData, Bucket: config.s3.bucketName, Key: recipe.uuid, ACL: "public-read" }, (err, data) => {
        if (err) {
            res.status(500).json({error: `Failed to upload image: ${err}`});
        } else {
            recipe.imageUrl = `https://s3-${config.aws.region}.amazonaws.com/${config.s3.bucketName}/${recipe.uuid}`;
            rekognition.detectText({ Image: { Bytes: imageData } }, (err, data) => {
                if (err) {
                    console.log("Failed to detect text", err);
                } else {
                    recipe.text = data.TextDetections
                        .filter(det => det.ParentId == null)
                        .sort((a, b) => (a.Geometry.BoundingBox.Left + a.Geometry.BoundingBox.Top) - (b.Geometry.BoundingBox.Left + b.Geometry.BoundingBox.Top) )
                        .map(det => det.DetectedText);
                }
        
                // Store recipe
                dynamoDb.put({ TableName: config.db.tableName, Item: recipe }, (err, data) => {
                    if (err) {
                        res.status(500).json({error: `Failed to store recipe: ${err}`});
                    } else {
                        res.json(recipe);
                    }
                });
            });
        }
    });
        
});

module.exports = app;
