const request = require('supertest');
const BASE_URL = 'http://localhost:8081';

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

// Helper function to clean up test users
async function cleanupTestUsers() {
    console.log('🧹 Cleaning up test users...');

    try {
        const getAllResponse = await request(BASE_URL).get('/users');
        if (getAllResponse.status === 200 && getAllResponse.body) {
            const allUsers = getAllResponse.body;
            const testUsersToDelete = allUsers.filter((user) => user.isTestUser === true);

            console.log(`Found ${testUsersToDelete.length} test users to clean up`);

            for (const user of testUsersToDelete) {
                const deleteResponse = await request(BASE_URL).delete(`/users/${user._id}`);

                if (deleteResponse.status === 200) {
                    console.log(`✅ Deleted test user: ${user.email}`);
                }
            }

            console.log('🎯 Cleanup completed!');
        }
    } catch (error) {
        console.log('⚠️  Cleanup failed (this is okay):', error.message);
    }
}

// Helper function to create a valid test user
async function createTestUser(overrides = {}) {
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

    return await request(BASE_URL)
        .post('/users')
        .send({ ...defaultUser, ...overrides });
}

// Helper function to get a user by ID
async function getUserById(userId) {
    return await request(BASE_URL).get(`/users/${userId}`);
}

module.exports = {
    BASE_URL,
    testEmails,
    cleanupTestUsers,
    createTestUser,
    getUserById,
    request: (url) => request(url || BASE_URL)
};
