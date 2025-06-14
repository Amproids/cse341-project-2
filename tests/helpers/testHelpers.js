require('dotenv').config();
const request = require('supertest');
const BASE_URL = 'http://localhost:8081';

/**
 * Test Helper Utilities
 *
 * This module provides common utilities for testing the fitness tracker API.
 * It includes functions for creating test users, authentication, and cleanup.
 */

// Test emails that we use across all tests
const testEmails = [
    'john.doe@example.com',
    'jane.smith@example.com',
    'alex.johnson@example.com',
    'sarah.wilson@example.com',
    'young@example.com',
    'old@example.com',
    'delete.me@example.com',
    'update.test@example.com',
    'get.test@example.com'
];

// Store auth tokens for reuse
let authTokens = {
    user: null,
    admin: null
};

/**
 * Authenticates a user and returns their JWT token
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<string>} JWT token
 */
async function authenticateUser(credentials) {
    const response = await request(BASE_URL).post('/users/login').send(credentials);

    if (response.status === 200) {
        return response.body.token;
    }

    throw new Error(`Authentication failed: ${response.body.error}`);
}

/**
 * Creates a test user and optionally logs them in
 * @param {Object} overrides - User data overrides
 * @param {boolean} authenticate - Whether to authenticate after creation
 * @returns {Promise<Object>} Response object with userId and optional token
 */
async function createTestUser(overrides = {}, authenticate = false) {
    const defaultUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        password: 'SecurePassword123!',
        passwordConfirm: 'SecurePassword123!',
        dateOfBirth: '1990-05-15',
        gender: 'M',
        height: 180,
        weight: 75,
        isTestUser: true
    };

    const userData = { ...defaultUser, ...overrides };

    const createResponse = await request(BASE_URL).post('/users').send(userData);

    const result = {
        response: createResponse,
        userData: userData
    };

    if (createResponse.status === 201) {
        result.userId = createResponse.body._id;

        if (authenticate) {
            const token = await authenticateUser({
                email: userData.email,
                password: userData.password
            });
            result.token = token;
        }
    }

    return result;
}

/**
 * Gets a user by ID with authentication
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Response object
 */
async function getUserById(userId, token) {
    return await request(BASE_URL).get(`/users/${userId}`).set('Authorization', `Bearer ${token}`);
}

/**
 * Gets all users with authentication
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Response object
 */
async function getAllUsers(token) {
    return await request(BASE_URL).get('/users').set('Authorization', `Bearer ${token}`);
}

/**
 * Updates a user with authentication
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Response object
 */
async function updateUser(userId, updateData, token) {
    return await request(BASE_URL).put(`/users/${userId}`).set('Authorization', `Bearer ${token}`).send(updateData);
}

/**
 * Deletes a user with authentication
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Response object
 */
async function deleteUser(userId, token) {
    return await request(BASE_URL).delete(`/users/${userId}`).set('Authorization', `Bearer ${token}`);
}

/**
 * Cleans up test users from the database
 * This function requires authentication to work properly
 */
async function cleanupTestUsers() {
    console.log('🧹 Cleaning up test users...');

    try {
        // Log in as admin cleanup user

        const token = await authenticateUser({
            email: process.env.AUTO_ADMIN_EMAIL,
            password: process.env.AUTO_ADMIN_PASSWORD
        });

        const getAllResponse = await getAllUsers(token);

        if (getAllResponse.status === 200 && getAllResponse.body) {
            const allUsers = getAllResponse.body;
            const testUsersToDelete = allUsers.filter((user) => user.isTestUser === true);

            console.log(`Found ${testUsersToDelete.length} test users to clean up`);

            for (const user of testUsersToDelete) {
                // For each user, we need their own token or admin privileges
                // This is a simplified version - in production, you'd use admin token
                try {
                    await deleteUser(user._id, token);
                    console.log(`✅ Deleted test user: ${user.firstName} ${user.lastName}`);
                } catch (error) {
                    console.log(`⚠️  Could not delete user ${user._id}: ${error.message}`);
                }
            }

            console.log('🎯 Cleanup completed!');
        }
    } catch (error) {
        console.log('⚠️  Cleanup failed (this is okay):', error.message);
    }
}

/**
 * Gets or creates a cached auth token for testing
 * @param {string} type - Token type ('user' or 'admin')
 * @returns {Promise<string>} JWT token
 */
async function getCachedAuthToken(type = 'user') {
    if (authTokens[type]) {
        return authTokens[type];
    }

    const { token } = await createTestUser(
        {
            email: 'cached.user@example.com'
        },
        true
    );
    authTokens.user = token;
    return token;
}

/**
 * Clears cached auth tokens
 */
function clearAuthTokens() {
    authTokens = {
        user: null,
        admin: null
    };
}

module.exports = {
    BASE_URL,
    testEmails,
    cleanupTestUsers,
    createTestUser,
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    authenticateUser,
    getCachedAuthToken,
    clearAuthTokens,
    request: (url) => request(url || BASE_URL)
};
