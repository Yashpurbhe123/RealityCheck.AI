import { MatchServiceClient } from '@google-cloud/aiplatform';
import dotenv from 'dotenv';

dotenv.config();

export default new MatchServiceClient({
  apiEndpoint: `${process.env.GCP_PROJECT_REGION}-aiplatform.googleapis.com`,
  projectId: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_PROJECT_REGION,
});
