require("dotenv").config();
const express = require("express");
const cors = require('cors');
const router = require('./router');

module.exports = function App() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(router);

  return app;
};
