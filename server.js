// Load environment variables
require('dotenv').config();

// Import required modules
const mongodb = require('./db/connect');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const passport = require('passport');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware for parsing JSON requests
app.use(express.json());
app.use(passport.initialize());

// Swagger API Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// OAuth routes
app.use('/auth', require('./routes/auth'));

// Route handlers for fitness tracker
app.use('/workouts', require('./routes/workouts'));
app.use('/users', require('./routes/users'));
app.use('/', require('./routes'));

// Initialize MongoDB connection and start server
mongodb.initDb((err) => {
    if (err) {
        console.log('Database connection failed:', err);
    } else {
        app.listen(port, () => {
            console.log('Fitness Tracker API is listening at port ' + port);
            console.log(`API Documentation available at: http://localhost:${port}/api-docs`);
            console.log('Production API Documentation: https://cse341-project-2-7bfl.onrender.com/api-docs');
        });
    }
});