'use strict';

// Wrapper to run the app in AWS Lambda

const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const binaryMimeTypes = [
  'application/octet-stream',
  'font/eot',
  'font/opentype',
  'font/otf',
  'image/jpeg',
  'image/png',
  'image/svg+xml'
];
const server = awsServerlessExpress
  .createServer(app, null, binaryMimeTypes);
exports.handler = (event, context) =>
  awsServerlessExpress.proxy(server, event, context);
