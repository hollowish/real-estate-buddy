// App configuration — sourced from environment variables at build time.
// Replace placeholder values after AWS infrastructure is set up (Student D).
//
// To use environment variables with Vite, create a .env.local file (git-ignored):
//   VITE_API_URL=https://your-api-id.execute-api.us-west-2.amazonaws.com/prod
//   VITE_COGNITO_USER_POOL_ID=us-west-2_xxxxxxxxx
//   VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
//   VITE_PHOTOS_BUCKET=reb-photos-123456789012

const config = {
  // API Gateway base URL — all /api/* requests go here
  apiUrl: import.meta.env.VITE_API_URL || '',

  // Cognito User Pool — set by Student A after pool is created
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    region: import.meta.env.VITE_AWS_REGION || 'us-west-2',
  },

  // S3 photos bucket name — set by Student B after bucket is created
  photosBucket: import.meta.env.VITE_PHOTOS_BUCKET || '',
};

export default config;
