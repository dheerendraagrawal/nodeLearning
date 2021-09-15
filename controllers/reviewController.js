const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    next();
}

exports.createReview = factory.createOne(Review);

// exports.createReview = catchAsync(
//     async(req, res, next) => {
//         // // Allow nested routes
//         // if (!req.body.tour) req.body.tour = req.params.tourId;
//         // if (!req.body.user) req.body.user = req.user.id;

//         const review = await Review.create(req.body);

//         res.status(200).json({
//             status: 'Success',
//             date: {
//                 review
//             }
//         });
//     }
// );

// Handled with nested routes


exports.getReview = factory.getOne(Review);
// exports.getReview = catchAsync(
//     async(req, res, next) => {
//         const review = await Review.findById(req.params.id);

//         if (!review) {
//             return next(new AppError('Cannot find Review with that Id', 404));
//         }

//         res.status(200).json({
//             status: 'Success',
//             date: {
//                 review
//             }
//         });
//     }
// );

exports.getAllReview = factory.getAll(Review);

// exports.getAllReview = catchAsync(
//     async(req, res, next) => {
//         let filter = {};
//         if (req.params.tourId) filter = { tour: req.params.tourId }; 

//         const reviews = await Review.find(filter);

//         res.status(200).json({
//             status: 'Success',
//             result: reviews.length,
//             date: {
//                 reviews
//             }
//         });
//     }
// );

exports.deleteReview = factory.deleteOne(Review); 
exports.updateReview = factory.updateOne(Review);