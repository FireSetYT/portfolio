/* Файл: netlify/server.js */
const serverless = require('serverless-http');
const app = require('../app'); // Шлях до вашої логіки Express

// Обгортаємо додаток Express у функцію, яку може викликати Netlify
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Цей виклик обробляє запити, що надходять до функції
  return await handler(event, context);
};