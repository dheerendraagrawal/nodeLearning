// Schema for Documents/Models
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator'); // class contain predefined validator functions
// const User = require('./userModel');

// Everthing/key that is not in schema is not put in DB
const tourSchema = new mongoose.Schema({
     name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'] 
      //     // isAlpha is a funciton fro Validation Lib, even space is not allowed
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) { // custom validator function
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // Hide this field to be sent as output always
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation:{
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [{
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }],
    // guides: Array // emmbeded approach
    guides: [
      {
        type: mongoose.Schema.ObjectId, // Special type , which Specifies thayt value is a reference to some document
        ref: 'User' // Refers to User model internally , no need to import that file
      }
    ]
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});


// Applying index to a property
  // we can give additional parameters also in below index function
// tourSchema.index({ price: 1 });

// Compounding index
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' }); // 2d index

// Virtual Properties
tourSchema.virtual('durationWeeks').get(
function() { // normal function is used since arrow function doesn't allow to use this keyword
  return this.duration / 7;
}
);

// Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

      tourSchema.pre('save', function(next) {
          this.slug = slugify(this.name, {lower: true});
          next();
      });

      // Embedding users in Tour
      // tourSchema.pre('save', async function(next){
      //   const guidePromise = this.guides.map(async id => await User.findById(id));
      //   this.guides = await Promise.all(guidePromise);

      //   next();
      // });
      
    tourSchema.pre(/^find/, function(next){ // regular expression will trigger when all funciton start with find triggers
      this.find({ secretTour: {$ne: true} }) // this keyword point query rather than documents
      this.start = Date.now();
      next();
    });

    tourSchema.pre(/^find/, function(next){ // regular expression will trigger when all funciton start with find triggers
      this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
     });
      next();
    });

      tourSchema.post(/^find/, function(docs, next){ // will run after fetched from data base
        next();
      }); 

    // Aggregate Middleware

      // tourSchema.pre('aggregate', function(next){ // regular expression will trigger when all funciton start with find triggers
      //   this.pipeline().unshift({
      //     $match : {
      //       secretTour: { $ne: true }
      //     }
      //   }); // this will add another stage to aggregate funciton
        
      //   console.log(this.pipeline()); // Current aggregation obj
      //   next();
      // }); 

    // Model Middleware

// Creating collection from Schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
