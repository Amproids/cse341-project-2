// scripts/cleanup.js
const { cleanupTestUsers } = require('../helpers/testHelpers');

(async () => {
    try {
        await cleanupTestUsers();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
})();
