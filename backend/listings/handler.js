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
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { randomUUID } = require('crypto');

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });

const TABLE = process.env.LISTINGS_TABLE || 'reb-listings';
const BUCKET = process.env.PHOTOS_BUCKET;
if (!BUCKET) throw new Error('PHOTOS_BUCKET environment variable not set');

exports.handler = async (event) => {
  // Extract userId from JWT claims — never trust request body for identity
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return response(401, { error: 'Unauthorized' });

  const method = event.httpMethod;
  const listingId = event.pathParameters?.proxy || event.pathParameters?.id;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // POST /api/listings — create listing + presigned upload URL
    if (method === 'POST' && !listingId) {
      const { address, price } = body;
      if (!address || address.toString().trim() === '') {
        return response(400, { error: 'address is required' });
      }
      if (price === undefined || price === null || isNaN(Number(price))) {
        return response(400, { error: 'price must be a number' });
      }

      const newId = randomUUID();
      const now = new Date().toISOString();
      const s3Key = `${userId}/${newId}/${Date.now()}`;

      const listing = {
        listingId: newId,
        userId,
        address: address.toString().trim().slice(0, 500),
        price: Number(price),
        bedrooms:   body.bedrooms   !== undefined ? Number(body.bedrooms)   : null,
        bathrooms:  body.bathrooms  !== undefined ? Number(body.bathrooms)  : null,
        sqft:       body.sqft       !== undefined ? Number(body.sqft)       : null,
        mlsNumber:  body.mlsNumber  ? body.mlsNumber.toString().slice(0, 50)  : null,
        userNotes:  body.userNotes  ? body.userNotes.toString().slice(0, 5000) : null,
        userRating: body.userRating ? Number(body.userRating) : null,
        photos: [s3Key],
        aiScore: null,
        aiAnalysis: null,
        aiScoredAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await db.send(new PutCommand({ TableName: TABLE, Item: listing }));

      // Generate presigned S3 PUT URL for photo upload (browser uploads directly)
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key: s3Key }),
        { expiresIn: 900 } // 15 minutes
      );

      return response(201, { listing, uploadUrl });
    }

    // GET /api/listings — list all listings for this user
    if (method === 'GET' && !listingId) {
      const result = await db.send(new QueryCommand({
        TableName: TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      }));
      const listings = result.Items || [];
      await Promise.all(listings.map(addPhotoUrls));
      return response(200, { listings });
    }

    // GET /api/listings/{id} — get single listing
    if (method === 'GET' && listingId) {
      const item = await getAndVerify(listingId, userId);
      if (item.error) return response(item.status, { error: item.error });
      await addPhotoUrls(item);
      return response(200, item);
    }

    // PUT /api/listings/{id} — update listing
    if (method === 'PUT' && listingId) {
      const item = await getAndVerify(listingId, userId);
      if (item.error) return response(item.status, { error: item.error });

      const fields = ['address', 'price', 'bedrooms', 'bathrooms', 'sqft',
                      'mlsNumber', 'userNotes', 'userRating'];
      const sets = ['updatedAt = :updatedAt'];
      const vals = { ':updatedAt': new Date().toISOString() };

      for (const f of fields) {
        if (body[f] !== undefined) {
          sets.push(`#${f} = :${f}`);
          vals[`:${f}`] = body[f];
        }
      }

      await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { listingId },
        UpdateExpression: 'SET ' + sets.join(', '),
        ExpressionAttributeNames: Object.fromEntries(
          fields.filter(f => body[f] !== undefined).map(f => [`#${f}`, f])
        ),
        ExpressionAttributeValues: vals,
      }));

      return response(200, { message: 'Listing updated' });
    }

    // DELETE /api/listings/{id} — delete listing (S3 photo cleanup is best-effort)
    if (method === 'DELETE' && listingId) {
      const item = await getAndVerify(listingId, userId);
      if (item.error) return response(item.status, { error: item.error });

      await db.send(new DeleteCommand({ TableName: TABLE, Key: { listingId } }));
      return response(200, { message: 'Listing deleted' });
    }

    return response(405, { error: 'Method not allowed' });

  } catch (err) {
    console.error('Listings handler error:', err);
    return response(500, { error: 'Internal server error' });
  }
};

// Generate presigned GET URLs for each photo S3 key on a listing
async function addPhotoUrls(listing) {
  if (!listing.photos || listing.photos.length === 0) {
    listing.photoUrls = [];
    return;
  }
  listing.photoUrls = await Promise.all(
    listing.photos.map(key =>
      getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 900 })
    )
  );
}

// Fetch a listing and verify it belongs to the requesting user (IDOR prevention)
async function getAndVerify(listingId, userId) {
  const result = await db.send(new GetCommand({ TableName: TABLE, Key: { listingId } }));
  if (!result.Item) return { error: 'Listing not found', status: 404 };
  if (result.Item.userId !== userId) return { error: 'Forbidden', status: 403 };
  return result.Item;
}

function response(statusCode, body) {
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
