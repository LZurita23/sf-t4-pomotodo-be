require('dotenv').config();
const express = require('express');
const router = express.Router();

const todoData = require("../controllers/todoDataController");
const dynamoClient = require('../db');
const TableName = process.env.TABLE_NAME;

/* If the server is starting for the very first time, the table
will be empty - this will populate the db with a placeholder tododata
item. */ 
const populateTableWithPlaceholder = async () => {
  const params = {
    TableName,
    Key: {
      id: "0"
    }
  }
  await dynamoClient.scan(params).promise()
    .then((data) => {
      if (data.Items.length === 0) {
        params.Item = { id:"0", order: [], todos: {} };
        return dynamoClient.put(params).promise();
      }
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB " + error)
    });
}
populateTableWithPlaceholder();

router.get("/health", (req, res) => {
  res.status(200).send("healthy");
});

router.post("/api/todo-data", todoData.addTodo);
router.get("/api/todo-data", todoData.getTodos);

router.patch("/api/todo-data", todoData.updateOrder);
router.patch("/api/todo-data/:id", todoData.updateTodo);

router.delete("/api/todo-data/completed", todoData.deleteCompletedTodos);
router.delete("/api/todo-data/:id", todoData.deleteTodo);

module.exports = router;
