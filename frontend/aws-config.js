// src/config/aws.js
// ⚠️ Replace with YOUR actual values from the AWS Console

export const awsConfig = {
  region: 'us-wast-2',                   // your AWS region
  userPoolId: 'us-west-2_67E39NjQ1',     // Cognito → User Pool details
  clientId: '79lon5asqe452blgqk2nh0gl1s', // Cognito → App clients
};

// In your src/main.jsx, add:
// import { Amplify } from 'aws-amplify';
// import { awsConfig } from './config/aws';
// Amplify.configure({ Auth: { Cognito: { userPoolId: awsConfig.userPoolId, userPoolClientId: awsConfig.clientId } } });
