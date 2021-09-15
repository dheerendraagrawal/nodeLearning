const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//Providing options for merging parameters , for create Reivew functionality which is redirecting from tourroute
const router = express.Router({
    mergeParams: true
});

router.use(authController.protect);

router.route('/')
.get( reviewController.getAllReview)
.post(
    // authController.protect, 
    authController.restrictTo('user'), 
    reviewController.setTourUserIds, 
    reviewController.createReview
);

router.route('/:id')
.get(reviewController.getReview)
.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
.patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

module.exports = router;