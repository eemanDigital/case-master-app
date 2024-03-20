class AppError extends Error {
  constructor(message, statusCode) {
    // Call parent constructor
    super(message); // Call the Error constructor with the provided message

    // Set properties specific to AppError
    this.statusCode = statusCode; // HTTP status code of the error
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; // Derive status (fail for 4xx, error for 5xx)
    this.isOperational = true; // Indicates if the error is operational (i.e., expected) or a programming error

    // Capture the stack trace, excluding the constructor call from the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
