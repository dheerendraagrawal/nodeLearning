const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//Parse all cookies coming in request
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

// Heroku Dyno is a container which runs our app and restarts every 24 hours to keep our app healthy
// Heroku specific config
// Signterm -> initiation by heroku to terminate app... so req in between will be not processed, to over come this, here is the way

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// for enviroment like heroku which redirects request for internal proxy
app.enable('trust proxy');

app.set('view engine', 'pug'); // telling app to use this view engine
app.set('views', path.join(__dirname, 'views'));

// Allowing cors for all routes.. we can specifically also define cors()
// allow only simple request like get 
app.use(cors());
    // Access-Control-Allow-Origin *
    // back-end api.natours.com, front-end natours.com
// app.use(cors({
//     origin: 'https://www.natours.com'
// }));

// for handling request which are in pre-flight phase, sent by browser when non simple requests made
app.options('*', cors());
// only this particular route non-simple requests will be accepted
// app.options('api/v1/tours/:id', cors());

app.use(express.static(path.join(__dirname, 'public')));

// GLOBAL MIDDLEWARES
// Set Security HTTP headers
    app.use(helmet()); // helmet contains many middleware functions, some of them are active by default, we can make other active by refering documentation in git
    
    // Added for cross domain policies altered
    app.use(
        helmet.contentSecurityPolicy({
          useDefaults: true,
          directives: {
            "default-src": ["'self'", "https://*.mapbox.com", "ws:","https://*.stripe.com"],
            "script-src": ["'self'", "https://*.mapbox.com", "https://*.cloudflare.com", "https://*.googleapis.com", "https://*.stripe.com"],
            "style-src": ["'self'" , "https://*.googleapis.com", "https: 'unsafe-inline'"],
            "worker-src": ["'self'", "blob:"]
          },
        })
      );


// DEVELopment logging
// Using the configuration logging only when enviroment is development enviroment
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
        // app.use((req, res, next) => {
        //     console.log('Hello from middleware');
        //     next();
        // });
    }

// LIMIT req from same api

    const limiter = rateLimit({
        max: 1000,
        windowMs: 60 * 60 * 1000,
        message: 'Too many requests from this IP, please try again in an hour'
    });
    app.use('/api', limiter);

// Body parser, reading data from body into req.body
//inbuilt middleware
    app.use(express.json({
        limit: '10kb' // limit the size of json body 
    }));
    app.use(express.urlencoded({ extended: true, linit: '10kb' }));
    app.use(cookieParser());

// Data sanitization against NoSQL query injection
    app.use(mongoSanitize());


// Data sanatization against XSS
// prevent malwazre attack of recieving html/javascript code from user end
    app.use(xss());

// Prevent parameter pollution
    app.use(hpp({
        whitelist: [
            'duration' // we are allowing this property to be duplicated
            ,'ratingsQuantity',
            'ratingsAverage',
            'price',
            'maxGroupSize',
            'difficulty'
        ]
    }));

    app.use(compression());

//Serving static  Files
// allow us to use static files
    // app.use(express.static(`${__dirname}/public`)); // sent to top

// Test/ User defined Middleware
    app.use((req, res, next) => {
        req.requestTime = new Date().toISOString();
        // console.log(req.headers);
        // console.log(req.cookies);
        next();
    });

// for rendering template
// app.get('/', (req, res) => {
//     res.status(200).render('base', {
//         tour: 'The Forest hiker',
//         user: 'Jonas'
//     });
// });
// app.get('/overview', (res, req) => {
//     res.status(200).render('overview', {
//         title: 'All tours'
//     });
// });
// app.get('/tour', (res, req) => {
//     res.status(200).render('tour', {
//         title: 'The forest hiker'
//     });
// });

app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// to handle unexpected routes
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'Fail',
    //     message: `Can't find ${req.originalUrl} on this server` 
    // });

    // const err = new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;

    // it will skip all other middleware and run the error one
    // next(err);
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// By specifying 4 parameter,, express identifies that it is error handling middleware
app.use(globalErrorHandler);

module.exports = app;
