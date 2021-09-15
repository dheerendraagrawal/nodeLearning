// This file return to handle try catch which is written in every function, to avoid duplicay and centralize code

module.exports = fn => {
        return (req, res, next) => {
            fn( req, res, next).catch(next);
        }
    };