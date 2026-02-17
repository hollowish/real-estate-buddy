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

exports.handler = async (event) => {
  // TODO: Implement
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify({ message: 'Listings handler — not yet implemented' }),
  };
};
