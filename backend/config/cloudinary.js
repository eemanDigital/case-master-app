const cloudinary = require("cloudinary").v2;

// Validate environment variables
const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET, NODE_ENV } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET) {
  console.error("❌ Cloudinary configuration error: Missing credentials");
  throw new Error(
    "Cloudinary credentials are not properly configured. Please check your .env file."
  );
}

// ✅ Configure Cloudinary with timeout settings
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET,
  secure: true, // Always use HTTPS
  timeout: 120000, // 120 seconds (2 minutes) global timeout
  upload_timeout: 120000, // Specific timeout for uploads
});

// ✅ Verify configuration with error handling
const verifyCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log("✅ Cloudinary connected successfully");
    if (NODE_ENV === "development") {
      console.log(`📁 Cloud Name: ${CLOUD_NAME}`);
    }
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
    console.warn("⚠️ Server will continue but file uploads may fail");
    // Don't throw - allow server to start
  }
};

// Verify connection (non-blocking)
verifyCloudinaryConnection();

/**
 * ✅ Helper function with timeout handling
 */
const withTimeout = (promise, timeoutMs = 30000, operation = "Operation") => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error(`${operation} timeout after ${timeoutMs}ms`));
      }, timeoutMs)
    ),
  ]);
};

/**
 * Generate transformation URLs with error handling
 */
const getTransformedUrl = (publicId, options = {}) => {
  try {
    return cloudinary.url(publicId, {
      ...options,
      secure: true,
    });
  } catch (error) {
    console.error("Error generating transformed URL:", error);
    return null;
  }
};

/**
 * Generate thumbnail URL for images
 */
const getThumbnailUrl = (publicId) => {
  return getTransformedUrl(publicId, {
    width: 200,
    height: 200,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  });
};

/**
 * Generate optimized image URL
 */
const getOptimizedImageUrl = (publicId, width = 800) => {
  return getTransformedUrl(publicId, {
    width: width,
    crop: "scale",
    quality: "auto:best",
    fetch_format: "auto",
  });
};

/**
 * ✅ Bulk delete files with timeout and error handling
 */
const bulkDelete = async (publicIds, resourceType = "raw") => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return { deleted: {}, error: "No public IDs provided" };
    }

    console.log(`🗑️ Attempting to delete ${publicIds.length} files...`);

    const result = await withTimeout(
      cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
        invalidate: true,
      }),
      60000, // 60 second timeout for bulk operations
      "Bulk delete"
    );

    const deletedCount = Object.keys(result.deleted || {}).length;
    console.log(
      `✅ Successfully deleted ${deletedCount}/${publicIds.length} files`
    );

    return result;
  } catch (error) {
    console.error("❌ Bulk deletion failed:", error.message);

    // Don't throw - return error info instead
    return {
      error: error.message,
      partial: true,
      message: "Some files may not have been deleted. Please try again.",
    };
  }
};

/**
 * ✅ Get storage usage statistics with error handling
 */
const getStorageStats = async () => {
  try {
    const result = await withTimeout(
      cloudinary.api.usage(),
      15000,
      "Get storage stats"
    );

    return {
      used: (result.storage.usage / 1024 / 1024).toFixed(2), // MB
      limit: (result.storage.limit / 1024 / 1024).toFixed(2), // MB
      percentage: ((result.storage.usage / result.storage.limit) * 100).toFixed(
        2
      ),
      bandwidth: (result.bandwidth.usage / 1024 / 1024).toFixed(2), // MB
    };
  } catch (error) {
    console.error("Failed to get storage stats:", error.message);
    return {
      error: error.message,
      used: "N/A",
      limit: "N/A",
      percentage: "N/A",
      bandwidth: "N/A",
    };
  }
};

/**
 * ✅ List files in a folder with error handling
 */
const listFilesInFolder = async (folder, options = {}) => {
  try {
    const result = await withTimeout(
      cloudinary.api.resources({
        type: "upload",
        prefix: folder,
        max_results: options.maxResults || 100,
        ...options,
      }),
      30000,
      "List files"
    );

    return result.resources;
  } catch (error) {
    console.error(`Failed to list files in folder ${folder}:`, error.message);
    return [];
  }
};

/**
 * ✅ Delete folder with error handling
 */
const deleteFolder = async (folderPath) => {
  try {
    // First, delete all resources in the folder
    await withTimeout(
      cloudinary.api.delete_resources_by_prefix(folderPath, {
        invalidate: true,
      }),
      60000,
      "Delete folder resources"
    );

    // Then delete the folder itself
    const result = await withTimeout(
      cloudinary.api.delete_folder(folderPath),
      15000,
      "Delete folder"
    );

    console.log(`✅ Deleted folder: ${folderPath}`);
    return result;
  } catch (error) {
    console.error(`Failed to delete folder ${folderPath}:`, error.message);
    return { error: error.message };
  }
};

/**
 * ✅ Clean up unused files with better error handling
 */
const cleanupUnusedFiles = async (validPublicIds, folder = "documents") => {
  try {
    console.log(`🔍 Checking for orphaned files in ${folder}...`);

    // Get all files in Cloudinary folder
    const cloudinaryFiles = await listFilesInFolder(folder);

    if (!cloudinaryFiles || cloudinaryFiles.length === 0) {
      console.log("✅ No files found in folder");
      return { deletedCount: 0 };
    }

    const cloudinaryIds = cloudinaryFiles.map((file) => file.public_id);

    // Find files that don't exist in database
    const orphanedIds = cloudinaryIds.filter(
      (id) => !validPublicIds.includes(id)
    );

    if (orphanedIds.length === 0) {
      console.log("✅ No orphaned files found");
      return { deletedCount: 0 };
    }

    console.log(`🗑️ Found ${orphanedIds.length} orphaned files`);

    // Delete orphaned files in batches (Cloudinary has limits)
    const batchSize = 100;
    let totalDeleted = 0;

    for (let i = 0; i < orphanedIds.length; i += batchSize) {
      const batch = orphanedIds.slice(i, i + batchSize);
      const result = await bulkDelete(batch);

      if (result.deleted) {
        totalDeleted += Object.keys(result.deleted).length;
      }
    }

    console.log(
      `✅ Cleanup complete: ${totalDeleted}/${orphanedIds.length} files deleted`
    );
    return { deletedCount: totalDeleted, attempted: orphanedIds.length };
  } catch (error) {
    console.error("Cleanup failed:", error.message);
    return { error: error.message, deletedCount: 0 };
  }
};

/**
 * ✅ Health check for Cloudinary connection
 */
const healthCheck = async () => {
  try {
    await withTimeout(cloudinary.api.ping(), 10000, "Health check");
    return { status: "healthy", message: "Cloudinary is connected" };
  } catch (error) {
    return { status: "unhealthy", message: error.message };
  }
};

// Export cloudinary instance and helper functions
module.exports = cloudinary;
module.exports.helpers = {
  getTransformedUrl,
  getThumbnailUrl,
  getOptimizedImageUrl,
  bulkDelete,
  getStorageStats,
  listFilesInFolder,
  deleteFolder,
  cleanupUnusedFiles,
  healthCheck,
  verifyCloudinaryConnection,
};
