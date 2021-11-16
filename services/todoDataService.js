// Calling .config() will allow dotenv to pull environment variables from our .env file...
require('dotenv').config();
// ...made available from process.env
const TableName = process.env.TABLE_NAME;
// You'll need to call dynamoClient methods to envoke CRUD operations on the DynamoDB table
const dynamoClient = require('../db');
// uuid, useful for generating unique ids
const uuid = require("uuid");

module.exports = class TodoDataService {
  static async addTodo(todo) {
    const id = uuid.v4();
    todo.id = id;

    const params = {
      TableName, // "tododata"
    };

    try {
      // Check the "tododata" table for existing a tododata item
      //let existingTodoData = ...
      let existingTodoData = await dynamoClient.scan(params).promise().then((data) => {
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
        }
        // ... This is where the PUT goes?
        await dynamoClient.put(params).promise();
        
      } else { // a tododata item already exist
        existingTodoData = existingTodoData.Items[0];
        existingTodoData.order.push(id);
        existingTodoData.todos[id] = todo;
        
        // Replace the existing tododata item with the new one, created in the above three lines        
        const params = {
          TableName,
          Item: existingTodoData,
        }
        // ... Use PUT?
        await dynamoClient.put(params).promise();
        // Return the newly created tododata item line 64
      }
      let newItem = await dynamoClient.scan(params).promise().then((data) => {
        return data.Items[0];
      });
      // Return the newly created tododata item
      return newItem;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  static async getTodos() {
    try {
      const params = {
        TableName,
        Key: {
          id: "0"
        }
      }

      // Check the "tododata" table for the tododata item, and return it
      let toDos = await dynamoClient.get(params).promise().then((data) => {
        return data.Item;
      });
      return toDos;

    } catch (error) {
      console.error(error);
      return error;
    }
  }

  static async updateOrder(options) {
    try {
      const params = {
        TableName,
        Key: {
          id: "0"
        },
        UpdateExpression: "set #order = :newOrder" ,
          ExpressionAttributeNames: {
            "#order": "order"
        },
        ExpressionAttributeValues: {
          ":newOrder": options.order,
        },
      }
      // Update the tododata item
      await dynamoClient.update(params).promise();

    } catch (error) {
      console.error(error);
      return error;
    }
  }

  static async updateTodo(id, options) {
    try {
      let params = {
        TableName,
        Key: {
          id: "0"
        }
      }

      // Check the "tododata" table for the tododata item, and set it to "existingTodo"
      // let existingTodo = ...
      let existingTodo = await dynamoClient.get(params).promise().then((data) => {
        return data.Item;
      });

      for (let key in options) {
        existingTodo.todos[id][key] = options[key];
      }

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

  static async deleteTodo(id) {
    try {
      let params = {
        TableName,
        Key: {
          id: "0"
        }
      }

      // Check the "tododata" table for the tododata item, and set it to "existingTodo"
      let existingTodo = await dynamoClient.get(params).promise().then((data) => {
        return data.Item;
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

  static async deleteCompletedTodos() {
    try {
      let params = {
        TableName,
        Key: {
          id: "0"
        }
      }

      let existingTodo = await dynamoClient.scan(params).promise().then((data) => {
          return data.Items[0];
      });

      existingTodo.order = existingTodo.order.filter((orderId) => {
        return !existingTodo.todos[orderId].completed;
      });
      for (let id in existingTodo.todos) {
        if (existingTodo.todos[id].completed) {
          delete existingTodo.todos[id];
        }
      }
      
      params = {
        TableName,
        Item: {
          ...existingTodo
        }
      }

      await dynamoClient.put(params).promise();
    } catch (error) {
      console.error(error);
      return error;
    }
  }
};
