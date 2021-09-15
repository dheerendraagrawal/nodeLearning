import axios from 'axios'
import { showAlert } from './alerts'

const stripe = Stripe('pk_test_51JZwsUSFPecDGpqLkSuJNZhsQgpDYDT1lf0TojZkUtiItTLvJSkVZM2H4durlAQvM3t1kNLRlap49Fmd1cWKG7xu008LR7EwRu');

export const bookTour = async tourId => {
    // get checkout session from server
    
    try{
        const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);
    // create checkout form + charge credit card

        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch(err){
        console.log(err);
        showAlert('error', err);
    }
    
}