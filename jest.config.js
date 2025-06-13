module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 30000,
    verbose: true,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: ['routes/**/*.js', 'validators/**/*.js', '!**/node_modules/**']
};
