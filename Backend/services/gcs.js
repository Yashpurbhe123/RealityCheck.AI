const { Storage } = require('@google-cloud/storage');

// Bucket name
const BUCKET_NAME = 'twittle-demo-app-media-storage';

// Initialize Google Cloud Storage
// Supports both keyFilename and credentials JSON from environment variable
// let storageConfig = {};

// if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
//   // Path to service account key file
//   storageConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
// }

// if (process.env.GCS_CREDENTIALS_JSON) {
//   // JSON credentials as string (useful for production environments)
//   try {
//     storageConfig.credentials = JSON.parse(process.env.GCS_CREDENTIALS_JSON);
//   } catch (error) {
//     console.error('Error parsing GCS_CREDENTIALS_JSON:', error);
//   }
// }

// if (process.env.GCS_PROJECT_ID) {
//   storageConfig.projectId = process.env.GCS_PROJECT_ID;
// }

//for dev pass storageConfig to Storage() 
const storage = new Storage();

/**
 * Upload a file to Google Cloud Storage
 * @param {string} filePath - Local file path to upload
 * @param {string} destinationName - Name for the file in GCS bucket
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadFile(filePath, destinationName) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(destinationName);

    // Upload the file
    await bucket.upload(filePath, {
      destination: destinationName,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Return the public URL
    return `https://storage.googleapis.com/${BUCKET_NAME}/${destinationName}`;
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

/**
 * Upload a buffer to Google Cloud Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} destinationName - Name for the file in GCS bucket
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadBuffer(buffer, destinationName, mimeType) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(destinationName);

    // Create a write stream
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Make the file publicly accessible
          await file.makePublic();
          
          // Return the public URL
          const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationName}`;
          resolve(publicUrl);
        } catch (error) {
          reject(error);
        }
      });

      stream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading buffer to GCS:', error);
    throw error;
  }
}

/**
 * Delete a file from Google Cloud Storage
 * @param {string} fileName - Name of the file in GCS bucket
 * @returns {Promise<void>}
 */
async function deleteFile(fileName) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);
    await file.delete();
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 404) {
      throw error;
    }
  }
}

module.exports = {
  uploadFile,
  uploadBuffer,
  deleteFile,
  BUCKET_NAME,
};

