// Shared DynamoDB helper
// Reusable functions for all Lambda handlers
//
// Usage in your handler:
//   const { getItem, putItem, queryByUserId } = require('../shared/dynamodb');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

// TODO: Implement shared helper functions
// Examples:
//   getItem(tableName, key)
//   putItem(tableName, item)
//   queryByUserId(tableName, indexName, userId)
//   updateItem(tableName, key, updates)
//   deleteItem(tableName, key)

module.exports = {
  docClient,
  // Export helper functions here
};
