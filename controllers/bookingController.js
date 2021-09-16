const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');


const createBookingCheckout = async session => {

    console.log('---------------------------------');
    const tour = session.client_reference_id; 

    console.log('-----------tour----------------------');

    let user = await User.find({ email: session.customer_email });
    console.log('-----------user----------------------');

    const price = session.amount_total; // 'display_items key name kept as session response from stripe'

    console.log('-----------price----------------------');

    console.log('-----------', tour, user, user._id, price , '----------------------');

    await Booking.create({tour, user, price});
    
};

exports.getCheckoutSession = catchAsync(async (req, res, next) => {

    // Get the currently booked tour

    const tour = await Tour.findById(req.params.tourId);

    // create checkout session

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, // passing tour id so it can be used in webhook callback function
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`${req.protocol}://${req.get('host')}/img/tours/tour-1-cover.jpg`],
                amount: tour.price * 70,
                currency: 'inr',
                quantity: 1
            }
        ]
    });

    // create session response
    res.status(200).json({
        status: 'success',
        session
    });

});
//Below funciton commented , it was unsecure way of implementing booking entry to our database while home page hits
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // This is unsecure , everyone can make booking without paying
//     const { tour, user, price } = req.query;
    
//     if(!tour && !user && !price) {
//         return next();
//     }

//     await Booking.create({tour, user, price});
    
//     // redirecting to home without query string that came from checkout page
//     res.redirect(req.originalUrl.split('?')[0]);
// });

exports.webhookCheckout = (req, res, next) => {
    // reading data sent by stripe web hook
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            signature, 
            process.env.STRIPE_WEBHOOK_SECRET
            );
    } catch(err) {
        // sending back error to Stripe
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        // calling local funciton to make database entry
        console.log('-----------------', 'Creating booking', '----------------');
        console.log(event.data.object);
        // try{
            createBookingCheckout(event.data.object);
        // } catch(err) {
        //     return res.status(400).json({ message: `Payment Sucess but Booking not created for Session Id: ${event.id}` });
        // } 
    }

    // sending back response to stripe for sucess
    res.status(200).json({ recieved: true });
}


exports.getBookings = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);