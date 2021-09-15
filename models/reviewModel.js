// review / rating / createdAt / ref to tour / ref to user
const mongoose = require("mongoose");
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        required: [true, 'Rating cannot be empty'],
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.']
        }
    ,
    user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a User.']
        }
}, {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  });

  reviewSchema.index({ tour: 1, user: 1 }, {
    unique: true
  });

  reviewSchema.pre(/^find/, function ( next) {
    // this.populate({
    //   path: 'tour',
    //   select: 'name'
    // }).populate({
    //   path: 'user',
    //   select: 'name photo'
    // });

    this.populate({
      path: 'user',
      select: 'name photo'
    });
    next();
  });

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { 
      $match : {
        tour: tourId
      }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: {
          $avg: '$rating'
        }
      }
    }
  ]);

  // console.log(stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats.length ? stats[0].nRating : 0,
    ratingsAverage: stats.length ? stats[0].avgRating : 0
  });
};

reviewSchema.post('save', function(next) {
  
  this.constructor.calcAverageRatings(this.tour);

  // next();
});

//Pre middleware for query type middleware
reviewSchema.pre(/^findOneAnd/,async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/,async function() {
  // await this.findOne(); // doesnot work here as the query already executed
  await this.r.constructor.calcAverageRatings(this.r.tour); // r referencing to variable defined in pre middleware
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// POST/ tour/xyz/reviews
// GET/ tour/xyz/reviews