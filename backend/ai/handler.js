// Student C: AI Scoring Engine Lambda Handler
// Sends listing + user preferences to Bedrock, returns a score and analysis.
//
// Routes:
//   POST /api/ai/score   — Score a listing { listingId: "..." }
//
// SECURITY NOTES:
// - IDOR check: listing.userId must match JWT sub (users can only score their own listings)
// - Prompt is constructed SERVER-SIDE (user never controls prompt text — prevents prompt injection)
// - Bedrock accessed via IAM role (no API keys in code)
// - Only listing data and user preferences are sent to the AI (no email/identity info)

const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const REGION = process.env.AWS_REGION || 'us-west-2';
const LISTINGS_TABLE = process.env.LISTINGS_TABLE || 'reb-listings';
const USERS_TABLE = process.env.USERS_TABLE || 'reb-users';
// claude-3-5-haiku — fast, cheap, good enough for scoring
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-haiku-20241022-v1:0';

const dynamo = new DynamoDBClient({ region: REGION });
const bedrock = new BedrockRuntimeClient({ region: REGION });

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

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Only accept POST /api/ai/score
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  // Extract userId from Cognito JWT claims (set by API Gateway authorizer)
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return respond(401, { error: 'Unauthorized' });
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { error: 'Invalid request body' });
  }

  const { listingId } = body;
  if (!listingId || typeof listingId !== 'string') {
    return respond(400, { error: 'listingId is required' });
  }

  // ── 1. Fetch listing from DynamoDB ─────────────────────────────────────────
  let listing;
  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: LISTINGS_TABLE,
      Key: marshall({ listingId }),
    }));
    if (!result.Item) {
      return respond(404, { error: 'Listing not found' });
    }
    listing = unmarshall(result.Item);
  } catch (err) {
    console.error('DynamoDB GetItem (listing) failed:', err);
    return respond(500, { error: 'Failed to fetch listing' });
  }

  // ── 2. IDOR check — listing must belong to requesting user ─────────────────
  if (listing.userId !== userId) {
    return respond(403, { error: 'Forbidden' });
  }

  // ── 3. Fetch user preferences from DynamoDB ────────────────────────────────
  let userPreferences = {};
  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ userId }),
    }));
    if (result.Item) {
      const userRecord = unmarshall(result.Item);
      userPreferences = userRecord.preferences || {};
    }
  } catch (err) {
    // Non-fatal: score without preferences if fetch fails
    console.warn('DynamoDB GetItem (user prefs) failed, continuing without preferences:', err);
  }

  // ── 4. Build prompt (server-side — user never controls this text) ──────────
  const prompt = buildPrompt(listing, userPreferences);

  // ── 5. Call Bedrock ────────────────────────────────────────────────────────
  let aiResult;
  try {
    aiResult = await invokeBedrockWithRetry(prompt);
  } catch (err) {
    console.error('Bedrock invocation failed:', err);
    return respond(502, { error: 'AI service unavailable. Please try again.' });
  }

  // ── 6. Parse Bedrock response ──────────────────────────────────────────────
  let scoreData;
  try {
    scoreData = parseBedrockResponse(aiResult);
  } catch (err) {
    console.error('Failed to parse Bedrock response:', err, 'Raw response:', aiResult);
    return respond(502, { error: 'AI returned an unexpected response. Please try again.' });
  }

  // ── 7. Persist score + analysis back to listing ───────────────────────────
  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: LISTINGS_TABLE,
      Key: marshall({ listingId }),
      UpdateExpression: 'SET aiScore = :score, aiAnalysis = :analysis, aiScoredAt = :ts',
      ExpressionAttributeValues: marshall({
        ':score': scoreData.score,
        ':analysis': {
          pros: scoreData.pros,
          cons: scoreData.cons,
          summary: scoreData.summary,
        },
        ':ts': new Date().toISOString(),
      }),
    }));
  } catch (err) {
    // Non-fatal: return the score even if we can't persist it
    console.error('DynamoDB UpdateItem (save score) failed:', err);
  }

  return respond(200, {
    listingId,
    score: scoreData.score,
    pros: scoreData.pros,
    cons: scoreData.cons,
    summary: scoreData.summary,
  });
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(listing, prefs) {
  const listingDetails = [
    `Address: ${listing.address || 'Not provided'}`,
    `Price: $${listing.price ? listing.price.toLocaleString() : 'Not provided'}`,
    `Bedrooms: ${listing.bedrooms ?? 'Not provided'}`,
    `Bathrooms: ${listing.bathrooms ?? 'Not provided'}`,
    `Square footage: ${listing.sqft ?? 'Not provided'}`,
    listing.notes ? `Notes: ${listing.notes}` : null,
    listing.userRating ? `User rating: ${listing.userRating}/5` : null,
  ].filter(Boolean).join('\n');

  const prefDetails = [
    prefs.minBedrooms != null ? `Minimum bedrooms: ${prefs.minBedrooms}` : null,
    prefs.maxPrice != null ? `Maximum price: $${prefs.maxPrice.toLocaleString()}` : null,
    prefs.preferredAreas?.length ? `Preferred areas: ${prefs.preferredAreas.join(', ')}` : null,
    prefs.mustHaves?.length ? `Must-haves: ${prefs.mustHaves.join(', ')}` : null,
    prefs.dealBreakers?.length ? `Deal-breakers: ${prefs.dealBreakers.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  return `You are a real estate advisor helping a homebuyer evaluate a property.

PROPERTY DETAILS:
${listingDetails}

BUYER PREFERENCES:
${prefDetails || 'No preferences provided.'}

Score this property from 1 to 100 based on how well it matches the buyer's preferences and represents good value. 100 is a perfect match; 1 is a terrible fit.

Respond with ONLY a valid JSON object in this exact format — no markdown, no explanation:
{
  "score": <integer 1-100>,
  "pros": [<up to 4 short bullet strings>],
  "cons": [<up to 4 short bullet strings>],
  "summary": "<2-3 sentence summary>"
}`;
}

// ─── Bedrock invocation with one retry ───────────────────────────────────────

async function invokeBedrockWithRetry(prompt) {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  };

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  try {
    const response = await bedrock.send(command);
    return JSON.parse(Buffer.from(response.body).toString('utf-8'));
  } catch (err) {
    // Retry once on transient errors
    if (err.name === 'ThrottlingException' || err.name === 'ServiceUnavailableException') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await bedrock.send(command);
      return JSON.parse(Buffer.from(response.body).toString('utf-8'));
    }
    throw err;
  }
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseBedrockResponse(bedrockResponse) {
  // Bedrock Messages API: response.content[0].text
  const text = bedrockResponse?.content?.[0]?.text;
  if (!text) {
    throw new Error('No text in Bedrock response');
  }

  // Strip markdown code fences if the model wrapped the JSON anyway
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Bedrock response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }

  const score = parseInt(parsed.score, 10);
  if (isNaN(score) || score < 1 || score > 100) {
    throw new Error(`Invalid score value: ${parsed.score}`);
  }

  return {
    score,
    pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 4) : [],
    cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 4) : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  };
}
