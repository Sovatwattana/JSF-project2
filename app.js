const express = require('express');
const application = express();
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const router = require('./routes');
const dotEnv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 4000;

dotEnv.config();

application.use(cookieParser());
application.use(session({
    secret: (process.env.secret || 'boorakacha'),
    cookie: {
        maxAge: 10800000
    },
    resave: true,
    saveUninitialized: true
}));
application.use(flash());
application.use((req, res, next) => {
    res.locals.flash = res.locals.flash || {};
    res.locals.flash.success = req.flash('success') || null;
    res.locals.flash.error = req.flash('error') || null;
    next();
});
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect(process.env.DB_URI, {
    auth: {
        user: process.env.DB_USER_NAME,
        password: process.env.DB_PASSWORD
    },
    useNewUrlParser: true  
}).catch(error => console.log(`ERROR: ${error}`));

function isAuthenticated(request) {
    const token = (request.cookies && request.cookies.token) ||
                  (request.body && request.body.token) ||
                  (request.query && request.query.token) ||
                  (request.headers && request.headers['x-access-token']);
    if (request.session && request.session.userId) {
        return true;
    }
    if (!token) {
        return false;
    } else {
        jwt.verify(token, "ZeyadSecret", (error, decoded) => {
            if (error) {
                return false;
            } else {
                return true;
            }
        })
    }
}

application.use((request, response, next) => {
    request.isAuthenticated = () => {
        return isAuthenticated(request);
    }
    next();
});

application.use('/api', router);

application.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

application.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
