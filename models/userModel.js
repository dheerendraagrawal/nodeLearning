const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your Email!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid Email!']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, 'Please provide Password!'],
        minLength : 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm Password'],
        validate: {
            // Only works for CREATE and SAVE
            validator : function(el) {
                return this.password === el;
            },
            message: 'Initial password should match confirm Password'
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin'],
        },
        default: 'user'
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) { // this is mongoose provided method, run only when password modified
        return next();
    }
    //Hashing password
    this.password = await bcrypt.hash(this.password, 12);
    
    // Deleting comfirm password
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // to ensure  this date is created before the actual token date is assigned

    next();
});

userSchema.post('save', async function(document, next){
    this.password = undefined;
    next();
});

userSchema.pre(/^find/, function(next) {
    // this point to current query
    this.find({ active: { $ne: false } });
    next();
});

// Known as instance methods
// This bbelow function will be available globally 
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    // Dcrpt password
    return await bcrypt.compare(candidatePassword, userPassword);  
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp =  parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return changedTimeStamp > JWTTimeStamp;
    }
    return false; 
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
