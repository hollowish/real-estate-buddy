// Student C: AI Scoring Engine Lambda Handler
// Sends listing + user preferences to Bedrock, returns a score and analysis.
//
// Routes:
//   POST /api/ai/score   — Score a listing { listingId: "..." }
//
// SECURITY NOTES:
// - Verify listing belongs to requesting user (IDOR prevention)
// - Prompt is constructed SERVER-SIDE (user never controls prompt text)
// - Bedrock accessed via IAM role (no API keys in code)
// - Only send necessary data to AI (no email, no identity info)

exports.handler = async (event) => {
  // TODO: Implement
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify({ message: 'AI scoring handler — not yet implemented' }),
  };
};
