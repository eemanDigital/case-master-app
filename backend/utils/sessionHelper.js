/**
 * Session Helper Utility
 * Handles MongoDB sessions with environment-aware detection
 * Works in both local (no replica set) and production (with replica set)
 */

const mongoose = require("mongoose");

/**
 * Check if transactions are supported
 * Transactions require MongoDB replica sets
 */
const isTransactionSupported = () => {
  const useTransactions = process.env.USE_TRANSACTIONS === "true";
  const isProduction = process.env.NODE_ENV === "production";

  return useTransactions || isProduction;
};

/**
 * Start a session if transactions are supported
 * @returns {Promise<mongoose.ClientSession|null>}
 */
const startSession = async () => {
  if (!isTransactionSupported()) {
    return null;
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  } catch (error) {
    console.warn(
      "Failed to start session, continuing without transaction:",
      error.message,
    );
    return null;
  }
};

/**
 * Commit transaction if session exists
 * @param {mongoose.ClientSession|null} session
 */
const commitTransaction = async (session) => {
  if (session) {
    await session.commitTransaction();
    session.endSession();
  }
};

/**
 * Abort transaction if session exists
 * @param {mongoose.ClientSession|null} session
 */
const abortTransaction = async (session) => {
  if (session) {
    try {
      await session.abortTransaction();
      session.endSession();
    } catch (error) {
      console.error("Error aborting transaction:", error.message);
    }
  }
};

/**
 * Execute query with optional session
 * @param {mongoose.Query} query - Mongoose query
 * @param {mongoose.ClientSession|null} session
 * @returns {Promise<any>}
 */
const executeWithSession = async (query, session) => {
  if (session) {
    return await query.session(session);
  }
  return await query;
};

/**
 * Save document with optional session
 * @param {mongoose.Document} document
 * @param {mongoose.ClientSession|null} session
 * @returns {Promise<mongoose.Document>}
 */
const saveWithSession = async (document, session) => {
  if (session) {
    return await document.save({ session });
  }
  return await document.save();
};

/**
 * Wrapper for operations that need transactions
 * Automatically handles session lifecycle
 *
 * @param {Function} operation - Async function that receives session as parameter
 * @returns {Promise<any>}
 *
 * @example
 * const result = await withTransaction(async (session) => {
 *   const user = await User.findById(id).session(session);
 *   user.balance += 100;
 *   await user.save({ session });
 *   return user;
 * });
 */
const withTransaction = async (operation) => {
  const session = await startSession();

  try {
    const result = await operation(session);
    await commitTransaction(session);
    return result;
  } catch (error) {
    await abortTransaction(session);
    throw error;
  }
};

module.exports = {
  isTransactionSupported,
  startSession,
  commitTransaction,
  abortTransaction,
  executeWithSession,
  saveWithSession,
  withTransaction,
};
