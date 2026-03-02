// src/config/aws.js
// ⚠️ Replace with YOUR actual values from the AWS Console

export const awsConfig = {
  region: 'us-east-1',                   // your AWS region
  userPoolId: 'us-east-1_XXXXXXXXX',     // Cognito → User Pool details
  clientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Cognito → App clients
};

// In your src/main.jsx, add:
// import { Amplify } from 'aws-amplify';
// import { awsConfig } from './config/aws';
// Amplify.configure({ Auth: { Cognito: { userPoolId: awsConfig.userPoolId, userPoolClientId: awsConfig.clientId } } });
