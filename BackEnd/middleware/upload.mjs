import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure Cloudinary dynamically from environment variables
 */
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
};

// Initial config attempt
configureCloudinary();

// Memory storage keeps file buffer in memory
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

/**
 * Upload a file buffer to Cloudinary with fallback
 */
export const uploadToCloudinary = (fileBuffer, mimetype = 'image/jpeg', folder = 'fitness_tracker') => {
  return new Promise((resolve, reject) => {
    // Re-verify configuration in case process.env was populated after module loading
    configureCloudinary();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudUrl = process.env.CLOUDINARY_URL;

    const isConfigured = Boolean(cloudUrl || (cloudName && apiKey && apiSecret));

    if (!isConfigured) {
      console.warn("Cloudinary credentials not detected in process.env. Using data URI fallback.");
      const base64 = fileBuffer.toString('base64');
      const dataUri = `data:${mimetype};base64,${base64}`;
      return resolve({ secure_url: dataUri });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload_stream error:", error);
          // If Cloudinary rejected (e.g., bad credentials or network error), fallback to data URI so user is not blocked
          const base64 = fileBuffer.toString('base64');
          const dataUri = `data:${mimetype};base64,${base64}`;
          return resolve({ secure_url: dataUri, warning: error.message });
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

export default upload;
