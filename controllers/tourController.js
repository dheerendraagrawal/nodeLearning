const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next();
}

// To save file to the memory
const multerStorage = multer.memoryStorage(); // creates buffer

// For filtering image type
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only image!.', 400), false);
    }
}

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// upload.single('image');
// upload.array('images', 5);

exports.resizeTourImages = catchAsync( async(req, res, next) => {

    if(!req.files.imageCover || !req.files.images) return next();

    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer).resize(2000, 1333).toFormat('jpeg').jpeg( {
        quality: 90
    } ).toFile(`public/img/tours/${req.body.imageCover}`);

    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`
        await sharp(file.buffer).resize(2000, 1333).toFormat('jpeg').jpeg( {
            quality: 90
        } ).toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    }));

    next();
});

// Transferd APIFeature class to Util folder
exports.getAllTour = factory.getAll(Tour);
// exports.getAllTour = catchAsync( async (req, res) => {
//     // try {
//         const features = new APIFeatures(Tour.find(), req.query)
//             .filter()
//             .sort()
//             .limitFields()
//             .paginate();
//         const tours = await features.query;

//         res.status(200).json({
//             status: 'success',
//             requestedTime: req.requestTime,
//             results: tours.length,
//             data: {
//                 tours 
//             }
//         });
//     // } catch(err) {
//     //     res.status(404).json({
//     //         status: 'Fail',
//     //         message: err.message || err
//     //     });
//     // }

// });

exports.getTourById = factory.getOne(Tour, { path: 'reviews' });

// exports.getTourById = catchAsync( async (req, res, next) => {

//     // try {
//         // Populate method to convert Id's into actual document that can be embeded into array
//         const tour = await Tour.findById(req.params.id).populate('reviews');
//         // .populate({
//         //    path: 'guides',
//         //    select: '-__v -passwordChangedAt'
//         // });

//         if(!tour) {
//             return next(new AppError('No tour found with that ID', 404));
//         }

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour
//             }
//         });
//     // } catch (error) {
//     //     res.status(404).json({
//     //         status: 'Fail',
//     //         message: error
//     //     });
//     // }

// });

// const catchAsync = fn => {
//     return (req, res, next) => {
//         fn( req, res, next).catch(next);
//     }
// }

exports.saveTour = factory.createOne(Tour);

// exports.saveTour = catchAsync(async (req, res) => {
//     // try {

//         const newTour = await Tour.create(req.body);

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour: newTour
//             }
//         });
//     // } catch (error) {
//         // res.status(400).json({
//         //     status: 'Fail',
//         //     message: error
//         // });   
//     // }
// });

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour =  catchAsync( async (req, res) => {
//     // try {
//         const tour = await Tour.findByIdAndUpdate(req.params.id, req.body,
//             // options to how to treate data while updating
//             { 
//             new: true,
//             runValidators: true // for making validators declared in Model to run
//          });

//          if(!tour) {
//             return next(new AppError('No tour found with that ID', 404));
//         }
//         res.status(200).json({
//             status: 'sucess',
//             data: {
//                 tour
//             }
//         });
//     // } catch (error) {
//     //     res.status(400).json({
//     //         status: 'Fail',
//     //         message: error
//     //     });
//     // }
  
// });   

// wrapped defination of functions that are repeated everytime in a single factory function by passing Model reference so that duplicay can be avoided
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour =  catchAsync( async (req, res, next) => {
//     // try {
//         const tour = await Tour.findByIdAndDelete(req.params.id);

//         if(!tour) {
//             return next(new AppError('No tour found with that ID', 404));
//         }

//         res.status(204).json({
//             status: 'sucess',
//             data: null
//         });
//     // } catch (error) {
//     //     res.status(400).json({
//     //         status: 'Fail',
//     //         message: error
//     //     });
//     // }
// });

// Using Aggregation Pipeline
exports.getTourStats =  catchAsync( async (req, res) => {
    // try {

        // .aggregate() returns aggregate obj
            // It contains different stages which contains implementation how the data is needed to be manipulated
        const stats = await Tour.aggregate([
            { 
                $match: { ratingsAverage: { $gte : 4.5 } }
            },
            {
                $group: {
                    _id: 
                    // '$difficulty', // with this particular column name result will be grouped,  it can be null also
                    { $toUpper: '$difficulty' } // this will make values in id key in uppercase
                    ,
                    num: { $sum: 1 },
                    numRatings: { $sum: '$ratingsAverage' },
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: {
                    avgPrice: 1 // keyName from above object ~group
                }
            },
        ]);
        res.status(200).json({
            status: 'sucess',
            data: {
                stats
            }
        });
    // } catch (error) {
    //     res.status(400).json({
    //         status: 'Fail',
    //         message: error
    //     });
    // }
});

exports.getMonthlyPlan = catchAsync(  async (req, res) => {
    // try {
        const year = req.params.year * 1;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStarts: { $sum: 1 },
                    tours: {
                        $push: '$name' // creates an array of names
                    }
                }
            }, 
            {
                $addFields: {
                    month: '$_id' // this stage copies/ creates a new key in every object with desired key value
                }
            },
            {
                $project: {
                    _id: 0 // Projection which removes desired key from object by passing 0 to it
                }
            },
            {
                $sort:
                {
                    numTourStarts : -1
                }
            },
            {
                $limit: 12 // set the limit of output
            }
        ]);

        res.status(200).json({
            status: 'sucess',
            data: {
                plan
            }
        });
    // } catch (error) {
    //     res.status(400).json({
    //         status: 'Fail',
    //         message: error
    //     });
    // }
});

exports.getToursWithin = catchAsync( async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // divided by radius of earth to convert in radians

    if(!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng.', 404));
    }

    // console.log(distance, lat, lng, unit);

    const tours = await Tour.find({ 
        startLocation: { 
            $geoWithin: { // geo special operator
                $centerSphere: [[lng, lat], radius] 
            } 
        } 
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
});

exports.getDistances = catchAsync( async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if(!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng.', 404));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier // converts each distance in km by multiplying by value
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});