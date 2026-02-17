// Frontend Configuration
// Replace these values with your actual AWS resource IDs after setup.
// These should eventually come from environment variables at build time.

const config = {
  // API Gateway
  apiUrl: 'https://YOUR_API_GATEWAY_ID.execute-api.us-west-2.amazonaws.com/prod',

  // Cognito
  cognitoUserPoolId: 'us-west-2_XXXXXXXXX',
  cognitoClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
  cognitoRegion: 'us-west-2',

  // S3
  photosBucket: 'reb-photos-YOUR_ACCOUNT_ID',
  photosRegion: 'us-west-2',
};

export default config;
