const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const upload = multer({ dest: 'public/img/users' });

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);


router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Since authentication is mandatory from below routes, assigning a middle ware for all below functions
// Protects all route after this middleware
router.use(authController.protect);

router.patch('/updatePassword',
// authController.protect,
authController.updatePassword
);

router.get('/me', 
    // authController.protect,
    userController.getMe,
    userController.getUser);

router.patch('/updateMe',
// authController.protect,
userController.uploadUserPhoto,
userController.resizeUserPhoto,
userController.updateMe
);

router.delete('/deleteMe',
// authController.protect,
userController.deleteMe
);

router.use(authController.restrictTo('admin'));

router
.route('/')
.get(userController.getAllUser)
.post(userController.saveUser);

router
.route('/:id')
.delete(userController.deleteUser)
.patch(userController.updateUser)
.get(userController.getUser);

module.exports = router;