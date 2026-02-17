// Student A: Auth & User Profile Lambda Handler
// This function handles user profile CRUD operations.
// Authentication is handled by Cognito — this Lambda only manages profile data in DynamoDB.
//
// Routes:
//   POST   /api/auth/profile   — Create user profile
//   GET    /api/auth/profile   — Get current user's profile
//   PUT    /api/auth/profile   — Update profile & preferences
//
// SECURITY NOTE: userId must come from the JWT token (event.requestContext.authorizer),
// NEVER from the request body. This prevents IDOR attacks.

exports.handler = async (event) => {
  // TODO: Implement
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Tighten this to your CloudFront domain in production
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify({ message: 'Auth handler — not yet implemented' }),
  };
};
