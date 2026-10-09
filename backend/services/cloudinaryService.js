const cloudinary = require('../config/cloudinary');
const { CLOUDINARY_CLOUD_NAME } = require('../config/env');

/**
 * Upload a file buffer to Cloudinary
 */
const uploadBufferToCloudinary = (fileBuffer, folder = 'disaster_system') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are not present, return a placeholder data URI for testing
    if (!CLOUDINARY_CLOUD_NAME) {
      const base64Data = fileBuffer.toString('base64');
      const mockUrl = `data:image/jpeg;base64,${base64Data}`;
      return resolve({
        secure_url: mockUrl,
        public_id: `local_${Date.now()}`
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadBufferToCloudinary
};
