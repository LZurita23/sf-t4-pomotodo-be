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

const addRecord = async (todo) => {
  const id = uuid.v4();
  todo.id = id;

  const params = {
    TableName,  //"tododata"
  };

  try {
    // Check the "tododata" table for existing a tododata item

    let existingTodoData = await dynamoClient.scan(params).promise().then((data) => {
      console.log(data);
      return data;
    });


    // no tododata exists yet
    if (existingTodoData.Items.length === 0) {
      const newTodoData = {
        order: [],
        todos: {}
      };
      newTodoData.id = "0";
      newTodoData.order.push(id);
      newTodoData.todos[id] = todo;

      // Add a new tododata placeholder item to the "tododata" table
      const params = {
        TableName,
        Item: newTodoData,
      };
      await dynamoClient.put(params).promise();

      return await dynamoClient.scan(params).promise().then((data) => {
        return data.Items[0];
      });
      // Return the newly created tododata item

    } else { // a tododata item already exist
      existingTodoData = existingTodoData.Items[0];
      existingTodoData.order.push(existingTodoData.id);
      existingTodoData.todos[existingTodoData.id] = todo;

      // Replace the existing tododata item with the new one, created in the above three lines
      const params = {
        TableName,
        Item: existingTodoData
      };
      await dynamoClient.put(params).promise();

      return await dynamoClient.scan(params).promise().then((data) => {
        return data.Items[0];
      });
      // Return the newly created tododata item
    }
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Lambda Handler
exports.addTodo = async (event) => {
  try {
    let data = await addRecord(JSON.parse(event.body)); 
    return response(200, data);
  } catch (err) {
    return response(400, { message: err.message });
  }
};