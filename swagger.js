require('dotenv').config();
const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'CSE 341 Project 2 - Fitness Tracker API',
        description: 'REST API for tracking workouts and managing users',
        version: '1.0.0',
    },
    host: process.env.BASE_URL,
    schemes: ['http', 'https'],
    securityDefinitions: {
        Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
        }
    },
    basePath: '/',
    '@definitions' : {

    }
};

const outputFile = './swagger.json';
const endpointsFiles = ['./server.js'];


swaggerAutogen(outputFile, endpointsFiles, doc);