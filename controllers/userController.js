const multer = require('multer');
const sharp = require('sharp');

const catchAscync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');

const factory = require('./handlerFactory');

// To save file to the disk
// const multerStorage = multer.diskStorage({
//     destination: (req, file,cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file,cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

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

const filterObj = (obj, ...allowedFields) => {
    Object.keys(obj).forEach((key) => {
        if(!allowedFields.includes(key)) {
            delete obj[key];
        }
    });
};

// here 'photo' is name of field
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAscync( async (req, res, next) => {
    if(!req.file) return next();
    // console.log(req.file);
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // as we are converting img to jpeg so keeping it static

    // Image processing
    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg( {
        quality: 90
    } ).toFile(`public/img/users/${req.file.filename}`);

    next();
});

exports.saveUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: 'This route is not defined ! Please use /signup instead'
    });
}

// exports.getAllUser = catchAscync(async (req, res, next) => {
//     const users = await User.find();

//     res.status(200).json({
//         status: 'Success',
//         results: users.length,
//         data: {
//             users
//         }
//     });

// });

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAscync(async (req, res, next) => {
    // Create error if user post password data

    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password update.', 400));
    }

    // filteredout unwanted field names
    filterObj(req.body, 'name', 'email');
    if (req.file) {
        req.body.photo = req.file.filename;
    }

    // update user document
    
    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
} );

exports.deleteMe = catchAscync( async(req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(200).json({
        status: 'sucess',
        token: null,
        data: null
    });
});

// exports.updateUser = (req, res) => {
//     res.status(500).json({
//         status: 'Server Err',
//         message: 'Route not Defined yet'
//     });
// }

// Donot update passwords with This!

exports.getAllUser = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);