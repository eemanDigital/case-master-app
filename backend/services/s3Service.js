const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

class S3Service {
  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET_NAME;
    this.region = process.env.AWS_REGION || "us-east-1";
  }

  /**
   * Generate unique S3 key for file with firm-based folder structure
   * @param {string} originalName - Original filename
   * @param {string} category - File category
   * @param {string} entityType - Entity type (Case, Task, etc)
   * @param {string} firmId - Firm ID for folder isolation
   * @returns {string} - S3 key
   */
  generateS3Key(
    originalName,
    category = "general",
    entityType = "general",
    firmId
  ) {
    if (!firmId) {
      throw new Error("firmId is required for S3 key generation");
    }

    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_");

    // Folder structure: firms/{firmId}/{category}/{entityType}/{timestamp}-{random}-{filename}
    return `firms/${firmId}/${category}/${entityType}/${timestamp}-${randomString}-${sanitizedBaseName}${ext}`;
  }

  /**
   * Upload file to S3 with firm-based folder isolation
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} mimeType - MIME type
   * @param {Object} metadata - Additional metadata (must include firmId)
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(fileBuffer, originalName, mimeType, metadata = {}) {
    try {
      // Ensure firmId is present
      if (!metadata.firmId) {
        throw new Error("firmId is required for file upload");
      }

      const s3Key = this.generateS3Key(
        originalName,
        metadata.category,
        metadata.entityType,
        metadata.firmId
      );

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          originalName: originalName,
          uploadedBy: metadata.uploadedBy ? metadata.uploadedBy.toString() : "",
          entityType: metadata.entityType || "",
          entityId: metadata.entityId ? metadata.entityId.toString() : "",
          firmId: metadata.firmId.toString(),
          category: metadata.category || "",
        },
        // Optional: Set server-side encryption
        ServerSideEncryption: "AES256",
      });

      await s3Client.send(command);

      // Generate presigned URL immediately for download
      const presignedUrl = await this.getPresignedUrl(s3Key, 3600);

      // Generate file URL
      const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`;

      return {
        s3Key,
        fileUrl,
        presignedUrl,
        bucket: this.bucket,
        region: this.region,
      };
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for secure file download
   * @param {string} s3Key - S3 key
   * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns {Promise<string>} - Presigned URL
   */
  async getPresignedUrl(s3Key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} s3Key - S3 key
   * @returns {Promise<void>}
   */
  async deleteFile(s3Key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("Error deleting from S3:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   * @param {string} s3Key - S3 key
   * @returns {Promise<boolean>}
   */
  async fileExists(s3Key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   * @param {string} s3Key - S3 key
   * @returns {Promise<Object>}
   */
  async getFileMetadata(s3Key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      const response = await s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error("Error getting file metadata:", error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List files for a specific firm
   * @param {string} firmId - Firm ID
   * @param {string} prefix - Additional prefix (optional)
   * @returns {Promise<Array>}
   */
  async listFirmFiles(firmId, prefix = "") {
    try {
      // Base prefix is always the firm's folder
      const firmPrefix = `firms/${firmId}/${prefix}`;

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: firmPrefix,
      });

      const response = await s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error("Error listing firm files:", error);
      throw new Error(`Failed to list firm files: ${error.message}`);
    }
  }

  /**
   * List files in a specific folder/prefix
   * @param {string} prefix - S3 prefix (folder path)
   * @returns {Promise<Array>}
   */
  async listFiles(prefix = "") {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error("Error listing files:", error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Copy file within S3 (useful for backups or moving between categories)
   * @param {string} sourceKey - Source S3 key
   * @param {string} destinationKey - Destination S3 key
   * @returns {Promise<void>}
   */
  async copyFile(sourceKey, destinationKey) {
    try {
      const { CopyObjectCommand } = require("@aws-sdk/client-s3");
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("Error copying file:", error);
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Generate multiple presigned URLs
   * @param {Array<string>} s3Keys - Array of S3 keys
   * @param {number} expiresIn - URL expiration in seconds
   * @returns {Promise<Array<Object>>}
   */
  async getMultiplePresignedUrls(s3Keys, expiresIn = 3600) {
    try {
      const urlPromises = s3Keys.map(async (key) => ({
        s3Key: key,
        url: await this.getPresignedUrl(key, expiresIn),
      }));

      return await Promise.all(urlPromises);
    } catch (error) {
      console.error("Error generating multiple presigned URLs:", error);
      throw new Error(`Failed to generate download URLs: ${error.message}`);
    }
  }

  /**
   * Delete all files for a firm (use with caution - for firm deletion)
   * @param {string} firmId - Firm ID
   * @returns {Promise<Object>}
   */
  async deleteFirmFiles(firmId) {
    try {
      const firmPrefix = `firms/${firmId}/`;

      // List all firm files
      const files = await this.listFiles(firmPrefix);

      if (files.length === 0) {
        return { deleted: 0, errors: [] };
      }

      // Delete files in batches
      const deletePromises = files.map((file) => this.deleteFile(file.Key));

      const results = await Promise.allSettled(deletePromises);

      const deleted = results.filter((r) => r.status === "fulfilled").length;
      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason);

      return { deleted, errors, total: files.length };
    } catch (error) {
      console.error("Error deleting firm files:", error);
      throw new Error(`Failed to delete firm files: ${error.message}`);
    }
  }

  /**
   * Get storage usage for a firm
   * @param {string} firmId - Firm ID
   * @returns {Promise<Object>}
   */
  async getFirmStorageUsage(firmId) {
    try {
      const firmPrefix = `firms/${firmId}/`;
      const files = await this.listFiles(firmPrefix);

      const totalSize = files.reduce((sum, file) => sum + (file.Size || 0), 0);
      const totalFiles = files.length;

      return {
        totalFiles,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4),
      };
    } catch (error) {
      console.error("Error getting firm storage usage:", error);
      throw new Error(`Failed to get storage usage: ${error.message}`);
    }
  }

  /**
   * Move file from one firm to another (for mergers/transfers)
   * @param {string} sourceKey - Source S3 key
   * @param {string} targetFirmId - Target firm ID
   * @param {string} category - File category
   * @param {string} entityType - Entity type
   * @returns {Promise<Object>}
   */
  async moveFileBetweenFirms(
    sourceKey,
    targetFirmId,
    category,
    entityType,
    originalName
  ) {
    try {
      // Generate new key for target firm
      const newKey = this.generateS3Key(
        originalName,
        category,
        entityType,
        targetFirmId
      );

      // Copy to new location
      await this.copyFile(sourceKey, newKey);

      // Delete old file
      await this.deleteFile(sourceKey);

      return {
        oldKey: sourceKey,
        newKey: newKey,
      };
    } catch (error) {
      console.error("Error moving file between firms:", error);
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  /**
   * Archive firm files (move to archive folder)
   * @param {string} firmId - Firm ID
   * @returns {Promise<Object>}
   */
  async archiveFirmFiles(firmId) {
    try {
      const firmPrefix = `firms/${firmId}/`;
      const archivePrefix = `archives/firms/${firmId}/`;

      const files = await this.listFiles(firmPrefix);

      const archivePromises = files.map(async (file) => {
        const newKey = file.Key.replace(firmPrefix, archivePrefix);
        await this.copyFile(file.Key, newKey);
        return { original: file.Key, archived: newKey };
      });

      const results = await Promise.all(archivePromises);

      return {
        archived: results.length,
        files: results,
      };
    } catch (error) {
      console.error("Error archiving firm files:", error);
      throw new Error(`Failed to archive firm files: ${error.message}`);
    }
  }
}

module.exports = new S3Service();
