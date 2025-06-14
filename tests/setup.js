const { cleanupTestUsers, getAllUsers, authenticateUser } = require('./helpers/testHelpers');

module.exports = async () => {
    console.log('🧹 Running global test cleanup...');
    await cleanupTestUsers();

    // Get admin token for the checks
    const adminToken = await authenticateUser({
        email: process.env.AUTO_ADMIN_EMAIL,
        password: process.env.AUTO_ADMIN_PASSWORD
    });

    // Crappy loop to wait for cleanup to actually finish
    for (let i = 0; i < 10; i++) {
        const remainingTestUsers = await getAllUsers(adminToken);
        const testUsers = remainingTestUsers.body.filter((u) => u.isTestUser === true);

        if (testUsers.length === 0) {
            break;
        }

        console.log(`💤 Still ${testUsers.length} test users remaining, waiting 100ms... (attempt ${i + 1}/10)`);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Final verification
    const finalCheck = await getAllUsers(adminToken);
    const finalTestUsers = finalCheck.body.filter((u) => u.isTestUser === true);
    if (finalTestUsers.length > 0) {
        throw new Error(`Global cleanup failed: ${finalTestUsers.length} test users still remain`);
    }

    console.log('🚀 Starting test suite...');
};
