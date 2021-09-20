const cors = require('cors');
const express = require('express');
const passport = require('passport');
const { connect } = require("mongoose");
const { success, error } = require('consola');

// Bring the app constants
const { DB, PORT } = require("./config");

// Initailize the application
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

require('./middlewares/passport')(passport);

// User Router Midlleware
app.use('/api/users', require('./routes/users'));

const startApp = async () => {
    try {
        // Connection with DB
        await connect(DB, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        
        success({
            message: `Successfully connected with the Database \n${DB}`,
            badge: true
        });

        // Start Listening for the server on PORT
        app.listen(PORT, () => success({
        message: `Server started on PORT ${PORT}`, badge: true})
    );
    } catch (err) {
        error({
            message: `Unable to connect with Database \n${err}`,
            badge: true
        });
        startApp();
    }
};


startApp();
