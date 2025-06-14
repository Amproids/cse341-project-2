const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'CSE 341 Project 2 - Fitness Tracker API',
        description: 'REST API for tracking workouts and managing users in a fitness application. Supports JWT authentication and OAuth with GitHub.',
        version: '1.0.0',
        contact: {
            name: 'API Support',
            email: 'support@fitnessapi.com'
        }
    },
    host: 'localhost:8081',
    schemes: ['http', 'https'],
    basePath: '/',
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
        Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'JWT token. Format: Bearer {token}'
        }
    },
    security: [
        {
            Bearer: []
        }
    ],
    definitions: {
        // User Models
        User: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                },
                firstName: {
                    type: 'string',
                    example: 'John'
                },
                lastName: {
                    type: 'string',
                    example: 'Doe'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john.doe@example.com'
                },
                dateOfBirth: {
                    type: 'string',
                    format: 'date-time',
                    example: '1990-01-15T00:00:00.000Z'
                },
                gender: {
                    type: 'string',
                    enum: ['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED'],
                    example: 'MALE'
                },
                height: {
                    type: 'number',
                    example: 180
                },
                weight: {
                    type: 'number',
                    example: 75
                },
                role: {
                    type: 'string',
                    enum: ['user', 'admin'],
                    example: 'user'
                },
                emailVerified: {
                    type: 'boolean',
                    example: false
                },
                isActive: {
                    type: 'boolean',
                    example: true
                },
                isTestUser: {
                    type: 'boolean',
                    example: false
                },
                githubId: {
                    type: 'string',
                    example: '12345678'
                },
                githubUsername: {
                    type: 'string',
                    example: 'johndoe'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-06-03T10:30:00.000Z'
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-06-03T10:30:00.000Z'
                }
            }
        },
        UserPublic: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                },
                firstName: {
                    type: 'string',
                    example: 'John'
                },
                lastName: {
                    type: 'string',
                    example: 'Doe'
                },
                gender: {
                    type: 'string',
                    example: 'MALE'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-06-03T10:30:00.000Z'
                },
                isTestUser: {
                    type: 'boolean',
                    example: false
                }
            }
        },
        UserRegistration: {
            type: 'object',
            required: ['firstName', 'lastName', 'email', 'password', 'passwordConfirm', 'dateOfBirth', 'gender'],
            properties: {
                firstName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 50,
                    example: 'John'
                },
                lastName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 50,
                    example: 'Doe'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john.doe@example.com'
                },
                password: {
                    type: 'string',
                    minLength: 8,
                    example: 'SecurePassword123!'
                },
                passwordConfirm: {
                    type: 'string',
                    minLength: 8,
                    example: 'SecurePassword123!'
                },
                dateOfBirth: {
                    type: 'string',
                    format: 'date',
                    example: '1990-01-15'
                },
                gender: {
                    type: 'string',
                    enum: ['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED'],
                    example: 'MALE'
                },
                height: {
                    type: 'number',
                    minimum: 0,
                    maximum: 300,
                    example: 180
                },
                weight: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1000,
                    example: 75
                },
                isTestUser: {
                    type: 'boolean',
                    example: false
                }
            }
        },
        UserUpdate: {
            type: 'object',
            properties: {
                firstName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 50,
                    example: 'John'
                },
                lastName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 50,
                    example: 'Doe'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john.doe@example.com'
                },
                dateOfBirth: {
                    type: 'string',
                    format: 'date',
                    example: '1990-01-15'
                },
                gender: {
                    type: 'string',
                    enum: ['MALE', 'FEMALE', 'OTHER', 'NOT_SPECIFIED'],
                    example: 'MALE'
                },
                height: {
                    type: 'number',
                    minimum: 0,
                    maximum: 300,
                    example: 180
                },
                weight: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1000,
                    example: 75
                }
            }
        },
        UserLogin: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john.doe@example.com'
                },
                password: {
                    type: 'string',
                    example: 'SecurePassword123!'
                }
            }
        },
        UserRoleUpdate: {
            type: 'object',
            required: ['role'],
            properties: {
                role: {
                    type: 'string',
                    enum: ['user', 'admin'],
                    example: 'admin'
                }
            }
        },
        
        // Workout Models
        Workout: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b4'
                },
                userId: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                },
                workoutName: {
                    type: 'string',
                    example: 'Morning Run'
                },
                date: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-06-03T00:00:00.000Z'
                },
                duration: {
                    type: 'number',
                    example: 30
                },
                caloriesBurned: {
                    type: 'number',
                    example: 300
                },
                exerciseType: {
                    type: 'string',
                    enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
                    example: 'cardio'
                },
                notes: {
                    type: 'string',
                    example: 'Beautiful morning run in the park'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-06-03T10:30:00.000Z'
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-06-03T10:30:00.000Z'
                },
                createdBy: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                }
            }
        },
        WorkoutCreate: {
            type: 'object',
            required: ['userId', 'workoutName', 'date', 'duration', 'caloriesBurned', 'exerciseType'],
            properties: {
                userId: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                },
                workoutName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100,
                    example: 'Morning Run'
                },
                date: {
                    type: 'string',
                    format: 'date',
                    example: '2024-06-03'
                },
                duration: {
                    type: 'number',
                    minimum: 1,
                    maximum: 1440,
                    example: 30
                },
                caloriesBurned: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10000,
                    example: 300
                },
                exerciseType: {
                    type: 'string',
                    enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
                    example: 'cardio'
                },
                notes: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Beautiful morning run in the park'
                }
            }
        },
        WorkoutUpdate: {
            type: 'object',
            properties: {
                userId: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                },
                workoutName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100,
                    example: 'Morning Run'
                },
                date: {
                    type: 'string',
                    format: 'date',
                    example: '2024-06-03'
                },
                duration: {
                    type: 'number',
                    minimum: 1,
                    maximum: 1440,
                    example: 30
                },
                caloriesBurned: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10000,
                    example: 300
                },
                exerciseType: {
                    type: 'string',
                    enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
                    example: 'cardio'
                },
                notes: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Beautiful morning run in the park'
                }
            }
        },
        WorkoutStats: {
            type: 'object',
            properties: {
                userId: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b3'
                },
                userName: {
                    type: 'string',
                    example: 'John Doe'
                },
                totalWorkouts: {
                    type: 'number',
                    example: 25
                },
                totalDuration: {
                    type: 'number',
                    example: 1500
                },
                totalCalories: {
                    type: 'number',
                    example: 12500
                },
                averageDuration: {
                    type: 'number',
                    example: 60
                },
                averageCalories: {
                    type: 'number',
                    example: 500
                },
                exerciseTypes: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    example: ['cardio', 'strength', 'flexibility']
                },
                recentWorkouts: {
                    type: 'number',
                    example: 3
                }
            }
        },
        
        // Response Models
        LoginResponse: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Login successful'
                },
                token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '6830c1332164274e3bf8b9b3'
                        },
                        firstName: {
                            type: 'string',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            example: 'Doe'
                        },
                        email: {
                            type: 'string',
                            example: 'john.doe@example.com'
                        },
                        role: {
                            type: 'string',
                            example: 'user'
                        }
                    }
                }
            }
        },
        OAuthResponse: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'GitHub OAuth login successful'
                },
                token: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '6830c1332164274e3bf8b9b3'
                        },
                        firstName: {
                            type: 'string',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            example: 'Doe'
                        },
                        email: {
                            type: 'string',
                            example: 'john.doe@example.com'
                        },
                        role: {
                            type: 'string',
                            example: 'user'
                        },
                        githubUsername: {
                            type: 'string',
                            example: 'johndoe'
                        }
                    }
                }
            }
        },
        WorkoutListResponse: {
            type: 'object',
            properties: {
                workouts: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/Workout'
                    }
                },
                pagination: {
                    type: 'object',
                    properties: {
                        currentPage: {
                            type: 'number',
                            example: 1
                        },
                        totalPages: {
                            type: 'number',
                            example: 5
                        },
                        totalWorkouts: {
                            type: 'number',
                            example: 50
                        },
                        hasNextPage: {
                            type: 'boolean',
                            example: true
                        },
                        hasPrevPage: {
                            type: 'boolean',
                            example: false
                        }
                    }
                }
            }
        },
        SuccessResponse: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Operation completed successfully'
                }
            }
        },
        CreateResponse: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Resource created successfully'
                },
                _id: {
                    type: 'string',
                    example: '6830c1332164274e3bf8b9b4'
                }
            }
        },
        ErrorResponse: {
            type: 'object',
            properties: {
                error: {
                    type: 'string',
                    example: 'Error message'
                },
                details: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    example: ['Validation error details']
                }
            }
        }
    },
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and OAuth endpoints'
        },
        {
            name: 'Users',
            description: 'User management operations'
        },
        {
            name: 'Workouts',
            description: 'Workout tracking and management'
        },
        {
            name: 'Statistics',
            description: 'Workout statistics and analytics'
        }
    ]
};

const outputFile = './swagger.json';
const endpointsFiles = ['./server.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);