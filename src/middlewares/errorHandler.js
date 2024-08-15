const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Default to 500 if status code is not provided
    if (!statusCode) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
};

export default errorHandler;