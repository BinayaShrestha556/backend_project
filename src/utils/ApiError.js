class ApiError extends Error {
  constructor(
    statusCode,
    message = "something went wrong",
    errors = [],
    stack = "",
  
  ) {
    super(message);
    this.message = message;
    this.data = message;
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    
    
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export {ApiError}