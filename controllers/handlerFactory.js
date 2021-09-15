const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync( async (req, res, next) => {
    // try {

        // if(req.params.bookingId) req.params.id = req.params.bookingId;

        const doc = await Model.findByIdAndDelete(req.params.id);

        if(!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(204).json({
            status: 'sucess',
            data: null
        });
});

exports.updateOne = Model => catchAsync( async (req, res) => {
    // try {
        // if(req.params.bookingId) req.params.id = req.params.bookingId;

        const doc = await Model.findByIdAndUpdate(req.params.id, req.body,
            // options to how to treate data while updating
            { 
            new: true,
            runValidators: true // for making validators declared in Model to run
         });

         if(!doc) {
            return next(new AppError('No Document found with that ID', 404));
        }
        res.status(200).json({
            status: 'sucess',
            data: {
                data: doc
            }
        });  
});   

exports.createOne = Model => catchAsync(async (req, res) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
        });
});

exports.getOne = (Model, popOptions) => catchAsync( async (req, res, next) => {

        let query =  Model.findById(req.params.id);
        if(popOptions) query = query.populate(popOptions);

        const doc = await query;

        if(!doc) {
            return next(new AppError('No tour found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
});

exports.getAll = Model => catchAsync( async (req, res) => {
        
    // To allow for nested GET reviews on tour (hack)
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };
        // if (req.params.bookingId) filter = { _id: req.params.bookingId }; 

        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const doc = await features.query;

        // to get internal details of query
        // const doc = await features.query.explain();

        res.status(200).json({
            status: 'success',
            requestedTime: req.requestTime,
            results: doc.length,
            data: {
                data: doc 
            }
        });

});