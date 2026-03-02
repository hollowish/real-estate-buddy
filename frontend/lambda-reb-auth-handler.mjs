import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);
const TABLE = 'reb-users';

export const handler = async (event) => {
  // Get userId from JWT claims (NOT from request body — prevents IDOR attacks)
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

  if (!userId) {
    return response(401, { error: 'Unauthorized — no user id in token' });
  }

  const method = event.requestContext.http.method;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (method === 'GET') {
      const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
      if (!result.Item) return response(404, { error: 'Profile not found' });
      return response(200, result.Item);
    }

    if (method === 'POST') {
      const profile = {
        userId,
        displayName: body.displayName || '',
        email: body.email || '',
        preferences: body.preferences || {},
        createdAt: new Date().toISOString(),
      };
      await db.send(new PutCommand({ TableName: TABLE, Item: profile }));
      return response(201, { message: 'Profile created', profile });
    }

    if (method === 'PUT') {
      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { userId },
        UpdateExpression: 'SET displayName = :n, preferences = :p, updatedAt = :u',
        ExpressionAttributeValues: {
          ':n': body.displayName,
          ':p': body.preferences || {},
          ':u': new Date().toISOString(),
        },
      }));
      return response(200, { message: 'Profile updated' });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (err) {
    console.error(err);
    return response(500, { error: 'Internal server error' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
