# Recipes Service

## Setup

Copy `config.js.default` to `config.js` and enter your AWS credentials.

Run `npm install` to install dependencies.

## Database

Create an AWS DynamoDB database table whose name matches the `config.db.tableName` value configured in `config.js`.
The primary key should be `uuid`.

## Run locally

Execute `node app.local.js` - you should see "Server is listening on port 3000"

## Deploy to AWS Lambda / API Gateway

This project uses https://github.com/awslabs/aws-serverless-express and https://claudiajs.com to run the Node.js application as a serverless app on AWS Lambda / API Gateway.

To prepare, setup AWS CLI tools and configure AWS credentials, e.g. using the `.aws/credentials` file.

To deploy to an AWS Lambda using Claudia, execute `$(npm bin)/claudia create --handler lambda.handler --deploy-proxy-api --region eu-central-1`

## API

The service currently supports the following API calls:

- `GET /`: returns a list of recipes stored in the database

- `POST /`: loads a recipe from the webpage specified through the `url` POST parameter and stores it in the database
