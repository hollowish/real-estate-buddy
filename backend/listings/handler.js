// Student B: Listings Manager Lambda Handler
// Handles CRUD for real estate listings and photo upload URL generation.
//
// Routes:
//   POST   /api/listings          — Create a new listing (returns presigned upload URL)
//   GET    /api/listings          — Get all listings for current user
//   GET    /api/listings/{id}     — Get a single listing
//   PUT    /api/listings/{id}     — Update a listing
//   DELETE /api/listings/{id}     — Delete a listing
//
// SECURITY NOTES:
// - userId from JWT token, not request body
// - All queries filter by userId (users only see their own listings)
// - Presigned URLs are time-limited (15 min) and scoped to specific S3 keys
// - Photos go directly from browser to S3 (never through Lambda)

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const REGION = process.env.AWS_REGION || 'us-west-2';
const TABLE = process.env.LISTINGS_TABLE || 'reb-listings';
const BUCKET = process.env.PHOTOS_BUCKET;

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const s3 = new S3Client({ region: REGION });

// Fields a user is allowed to change — listingId, userId, createdAt are never updatable
const UPDATABLE_FIELDS = ['address', 'price', 'bedrooms', 'bathrooms', 'sqft', 'mlsNumber', 'userNotes', 'userRating', 'photos'];

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // userId from Cognito JWT claims set by API Gateway authorizer — never from request body
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return respond(401, { error: 'Unauthorized' });

  const method = event.httpMethod;
  const listingId = event.pathParameters?.id;

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      return respond(400, { error: 'Invalid request body' });
    }
  }

  try {
    if (method === 'POST'   && !listingId) return await createListing(userId, body);
    if (method === 'GET'    && !listingId) return await listListings(userId);
    if (method === 'GET'    &&  listingId) return await getListing(userId, listingId);
    if (method === 'PUT'    &&  listingId) return await updateListing(userId, listingId, body);
    if (method === 'DELETE' &&  listingId) return await deleteListing(userId, listingId);
    return respond(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return respond(500, { error: 'Internal server error' });
  }
};

// ─── Route handlers ───────────────────────────────────────────────────────────

async function createListing(userId, body) {
  if (!body.address || body.price == null) {
    return respond(400, { error: 'address and price are required' });
  }

  const listingId = uuidv4();
  const now = new Date().toISOString();

  const listing = {
    listingId,
    userId,
    address:    body.address,
    price:      body.price,
    bedrooms:   body.bedrooms   ?? null,
    bathrooms:  body.bathrooms  ?? null,
    sqft:       body.sqft       ?? null,
    mlsNumber:  body.mlsNumber  ?? null,
    userNotes:  body.userNotes  ?? '',
    userRating: body.userRating ?? null,
    photos:     [],
    aiScore:    null,
    aiAnalysis: null,
    createdAt:  now,
    updatedAt:  now,
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: listing }));

  // B.4 — Generate a presigned PUT URL (15 min) so the browser uploads the photo
  // directly to S3. The Lambda never handles the file bytes.
  const photoKey = `${userId}/${listingId}/photo-1`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: photoKey }),
    { expiresIn: 900 },
  );

  return respond(201, { listing, uploadUrl, photoKey });
}

async function listListings(userId) {
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));

  return respond(200, { listings: result.Items });
}

async function getListing(userId, listingId) {
  const result = await db.send(new GetCommand({ TableName: TABLE, Key: { listingId } }));

  if (!result.Item) return respond(404, { error: 'Listing not found' });

  // IDOR check: confirm the listing belongs to the requesting user
  if (result.Item.userId !== userId) return respond(403, { error: 'Forbidden' });

  return respond(200, result.Item);
}

async function updateListing(userId, listingId, body) {
  // Verify ownership before touching the record
  const existing = await db.send(new GetCommand({ TableName: TABLE, Key: { listingId } }));

  if (!existing.Item) return respond(404, { error: 'Listing not found' });
  if (existing.Item.userId !== userId) return respond(403, { error: 'Forbidden' });

  // Build UpdateExpression dynamically — only allow fields in UPDATABLE_FIELDS
  const updates = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return respond(400, { error: 'No valid fields to update' });
  }

  updates.updatedAt = new Date().toISOString();

  const setExpression   = Object.keys(updates).map(k => `#${k} = :${k}`).join(', ');
  const expressionNames = Object.fromEntries(Object.keys(updates).map(k => [`#${k}`, k]));
  const expressionValues = Object.fromEntries(Object.keys(updates).map(k => [`:${k}`, updates[k]]));

  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { listingId },
    UpdateExpression: `SET ${setExpression}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
  }));

  return respond(200, { message: 'Listing updated' });
}

async function deleteListing(userId, listingId) {
  // Verify ownership before deleting
  const existing = await db.send(new GetCommand({ TableName: TABLE, Key: { listingId } }));

  if (!existing.Item) return respond(404, { error: 'Listing not found' });
  if (existing.Item.userId !== userId) return respond(403, { error: 'Forbidden' });

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { listingId } }));

  return respond(200, { message: 'Listing deleted' });
}

// ─── Response helper ──────────────────────────────────────────────────────────

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(body),
  };
}
