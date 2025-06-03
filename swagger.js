const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'CSE 341 Project 2 - Fitness Tracker API',
        description: 'REST API for tracking workouts and managing users in a fitness application',
        version: '1.0.0'
    },
    host: 'localhost:8081',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    definitions: {
        User: {
            _id: '6830c1332164274e3bf8b9b3',
            name: 'John Doe',
            email: 'john.doe@example.com',
            age: 25,
            weight: 180,
            createdAt: '2024-06-03T10:30:00.000Z'
        },
        UserInput: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            age: 25,
            weight: 180
        },
        Workout: {
            _id: '6830c1332164274e3bf8b9b4',
            userId: '6830c1332164274e3bf8b9b3',
            workoutName: 'Morning Run',
            date: '2024-06-03T00:00:00.000Z',
            duration: 30,
            caloriesBurned: 300,
            exerciseType: 'cardio',
            notes: 'Beautiful morning run in the park',
            createdAt: '2024-06-03T10:30:00.000Z'
        },
        WorkoutInput: {
            userId: '6830c1332164274e3bf8b9b3',
            workoutName: 'Morning Run',
            date: '2024-06-03',
            duration: 30,
            caloriesBurned: 300,
            exerciseType: 'cardio',
            notes: 'Beautiful morning run in the park'
        }
    }
};

const outputFile = './swagger.json';
const endpointsFiles = ['./server.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);