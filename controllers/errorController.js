const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldDB = err => {
    const value = Object.values(err.keyValue)[0]
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(e => e.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400); 
}

const handleJWTError = () => new AppError('Invalid Token. Please login in again!', 401);

const handleJWTExpireError = () => new AppError('Token expired. Please login Again!', 401);

const sendErrorDev = (err,req, res) => {
    if(req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } 

    console.log('ERROR', err);
    res.status(err.statusCode).render('error', {
        title: 'Somethong went wrong!',
        msg: err.message
    });
};

const sendErrProduction = (err,req, res) => {
    if(req.originalUrl.startsWith('/api')) {
        // Operational Error: send message to client
        if(err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });

        // Programming Error : don't leak error details
        }
            //  1 Log Error

        console.log('ERROR', err);

        //2 Send generic message
        return res.status(500).json({
            status: 'Error',
            message: 'Something went wrong'
        });
        
    } 
     // Operational Error: send message to client
    if(err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Somethong went wrong!',
            msg: err.message
        });

    // Programming Error : don't leak error details
    }
    //  1 Log Error

    console.log('ERROR', err);

    //2 Send generic message
    res.status(err.statusCode).render('error', {
        title: 'Somethong went wrong!',
        msg: 'Please try again later.'
    });
    

};

module.exports = (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500; 
    err.status = err.status || 'error';
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err,req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message;
        error.name = err.name;
        // Different types of mongoose Error like CastError/ValidationError etc.
        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if (error.code === 11000) { // For duplicate Key error
            error = handleDuplicateFieldDB(error);
        }
        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }
        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpireError();
        }
        sendErrProduction(error,req, res);
    }
}