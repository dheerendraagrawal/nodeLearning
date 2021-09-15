const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//Nested route, but method is not like this when implemented in real world
// router.route('/:tourId/reviews')
// .post(authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//     );

router.use('/:tourId/reviews', reviewRouter);

router
.route('/tour-stats')
.get(tourController.getTourStats);

router
.route('/monthly-plan/:year')
.get(authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router
.route('/top-5-cheap')
.get(tourController.aliasTopTours,tourController.getAllTour);

router.route('/tour-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
.route('/')
.get(tourController.getAllTour)
.post(
    authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.saveTour);

router.route('/:id')
.delete(authController.protect,
     authController.restrictTo('admin', 'lead-guide'), 
     tourController.deleteTour)
.patch(authController.protect,
    authController.restrictTo('admin', 'lead-guide')
    ,tourController.uploadTourImages,
    tourController.resizeTourImages
    , tourController.updateTour)
.get(tourController.getTourById);




module.exports = router;