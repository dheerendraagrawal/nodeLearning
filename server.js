const mongoose = require('mongoose');

const dotenv = require('dotenv');

// like using a variable which is not defined
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN...');
    console.log(err.name, err.message);
    process.exit(1); // this will kill the server
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(con => console.log('DB Connections Sucessfull'))
    // .catch(err => console.log('DB ERROR'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Listening to port no: ${port}`);
});

// Handle Unhandled Exception/ Rejection

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! SHUTTING DOWN...');
    console.log(err.name);
    server.close(() => {
        process.exit(1); // this will slowly kill the server
    });
    // process.exit(1); // this will end existing request in between
});

