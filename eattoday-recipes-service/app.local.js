'use strict';

// Wrapper to run the app locally (as compared to AWS Lambda)

const app = require('./app');
const port = process.env.PORT || 3000;
app.listen(port, () => 
  console.log(`Server is listening on port ${port}.`)
);
