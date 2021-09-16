const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// const sendEmail = require('./../utils/email');
const Email = require('./../utils/email');


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createAndSendTOken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    const cookiesOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    // Replacing below assignment in new if condition
    // if(process.env.NODE_ENV === 'production') {
    //     cookiesOptions.secure = true;
    // }

    // req.headers('x-forwarded-proto') kept for heroku particularly
    // checking if connection is secure so making cookies secure as well
    if(req.secure || req.headers('x-forwarded-proto') === 'https') {
            cookiesOptions.secure = true;
        }
    
    res.cookie('jwt', token, cookiesOptions);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {

    // Below line creates security flaw as anyone can create admin user so for altering that the code next should be used
    // const newUser = await User.create(req.body);
    
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    // console.log(url);
    await new Email(newUser, url).sendWelcome();

    createAndSendTOken(newUser, 201,req, res);
   
});

exports.login = catchAsync(async (req, res, next) => {
    // const email = req.body.email;
    // const password = req.body.password;
    // const {email} = req.body;
    // const {password} = req.body;
       const {email, password} = req.body;

      if(!email || !password) {
        return next(new AppError('Please provide email and password'), 400);
      }

    const user = await User.findOne({ email }).select('+password');
    // const correct = await user.correctPassword(password, user.password);
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect Email or Password', 401));
    }

    // const token = signToken(user._id);
    
    // res.status(200).json({
    //     status: 'Success',
    //     token
    // });

    createAndSendTOken(user, 200,req, res);

});

//Middleware for checking is any user is logged in or not
exports.isLoggedIn =  async (req, res, next) => {
    
    if (req.cookies.jwt) {
        try {
            //Verify Token
            const decodedPayload = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            const freshUser = await User.findById(decodedPayload.id);

            if (!freshUser) return next(); 

            // Check if user changes password after the JWT was issued

            if(freshUser.changedPasswordAfter(decodedPayload.iat)) return next();

            // There is a loggeg in user
            res.locals.user = freshUser;
            return next();
        } catch(err) {
            return next();
        }
    }

    next();
} ;

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({status : 'success'});
}

exports.protect = catchAsync( async (req, res, next) => {
    
    // Getting the token , if it is there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token) return next(new AppError('Your are not loggedIn, please login to get access', 401));

    // Validate token
    const decodedPayload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // User trying to acess, exists

    const freshUser = await User.findById(decodedPayload.id);

    if (!freshUser) return next(new AppError('User do not exists. Please Signup again', 401)); 

    // Check if user changes password after the JWT was issued

    if(freshUser.changedPasswordAfter(decodedPayload.iat)) return next(new AppError('User recently changed password. Please login again!', 401));

    // Grant access to protected route

    req.user = freshUser;
    res.locals.user = freshUser;
    next();
} );

exports.restrictTo = (...roles) => {
    return catchAsync(async (req, res, next) => {
        // roles is an arrray ['admin', 'lead-guide']
        // 403 is for forbidden-error
        if(!roles.includes(req.user.role)) return next(new AppError('You donot have permission to perform this action', 403));
        next();
    });
}; 

exports.forgotPassword = catchAsync(async(req, res, next) => {
    // Get User based on posted email
    const user = await User.findOne({ email: req.body.email });

    if(!user) return next(new AppError('THere is no user with that email.', 404));

    // Generate random token

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
   
    // const message = `Forgot your password? Submit a PATCH request wsith your new Password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {

        // send it back as an email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token (valid for 10 mins)',
        //     message
        // });

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'Success',
            message: 'Token sent to email'
        });
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({ validateBeforeSave: false });

        return next(new AppError('There is an error sending the Email. Try Again Later', 500));
    }
});

exports.resetPassword = catchAsync(async(req, res, next) => {
    // Get user based on token

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ 
        passwordResetToken: hashedToken ,
        passwordResetExpires: {
        $gt: Date.now()
    }});

    // if token is not expireed, and there is user, set new password
 
    if (!user) return next(new AppError('Token is invalid or Expired', 400)); 

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // udate changedPasswordAt property for user

    // Log the user in send JWT

    // const token = signToken(user._id);
    
    // res.status(200).json({
    //     status: 'Success',
    //     token
    // });

    createAndSendTOken(user, 200,req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // Get the user from collection
    const user = await User.findById( req.user._id ).select('+password');
    // console.log(req,user, user);

    // we need to check posted password is correct
    // console.log(user.correctPassword(req.body.passwordCurrent, user.password));

    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // if password correct update password

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // log user in send jwt

    createAndSendTOken(user, 200,req, res);
});