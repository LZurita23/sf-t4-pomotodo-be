
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



const deleteRecord = async (id) => {
  try {
    let params = {
      TableName,
      Key: {
        id: "0"
      }
    }

    // Check the "tododata" table for the tododata item, and set it to "existingTodo"
    let existingTodo = await dynamoClient.scan(params).promise().then((data) => {
      return data.Items[0];
    });

    existingTodo.order = existingTodo.order.filter((orderId) => {
      return orderId !== id
    });

    delete existingTodo.todos[id];

    params = {
      TableName,
      Item: {
        ...existingTodo
      }
    }

    // Replace the existing tododata item with the updated one
    await dynamoClient.put(params).promise();
    
  } catch (error) {
    console.error(error);
    return error;
  }
}

// Lambda Handler
exports.deleteTodo = async (event) => {
  console.log(event);
  try {
    const id = JSON.parse(event).body.orderId;
    let data = await deleteRecord(id); 
  
    return response(200, data);
   
  } catch (err) {
   
    return response(400, { message: err.message });

  }
};