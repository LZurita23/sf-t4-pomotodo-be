const AWS = require('aws-sdk');
const { REGION, TABLE_NAME } = process.env;
const options = { region: REGION };
const dynamoClient = new AWS.DynamoDB.DocumentClient(options);
const TableName = TABLE_NAME;
const uuid = require("uuid");


const response = (statusCode, body) => ({
  statusCode,
  body: JSON.stringify(body),
  headers: {
    "Content-Type": "application/json",
  },
});

const getRecord = async () => {
  try {
    const params = {
      TableName,
      Key: {
        id: "0"
      }
    }
    return await dynamoClient.scan(params).promise().then((data) => {
      return data.Items[0];
    });
    // Check the "tododata" table for the tododata item, and return it
  } catch (error) {
    console.error(error);
    return error;
  }
}

// Lambda Handler
exports.getTodo = async (event) => {
  console.log(event);

  try {
    let data = await getRecord(); 
  
    return response(200, data);
   
  } catch (err) {
   
    return response(400, { message: err.message });

  }
};