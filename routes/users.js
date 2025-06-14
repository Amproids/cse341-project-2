const express = require('express');
const router = express.Router();
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
    validateUserForCreation,
    validateUserForUpdate,
    normalizeEmail,
    validateUserForLogin
} = require('../validators/userValidator');
const { authenticateToken } = require('../middleware/auth');

// GET all users
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');

        // Only return publicly safe fields
        const users = await db
            .collection('users')
            .find(
                {},
                {
                    projection: {
                        firstName: 1,
                        lastName: 1,
                        // email: 1,        // Debatable - might be private
                        gender: 1,
                        // dateOfBirth: 1,  // Probably private
                        // height: 1,       // Personal info
                        // weight: 1,       // Personal info
                        createdAt: 1,
                        isTestUser: 1,
                        _id: 1 // Usually included by default
                    }
                }
            )
            .toArray();

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const userId = new ObjectId(req.params.id);
        const requestingUserId = new ObjectId(req.user.userId);

        // Check if user exists FIRST
        const user = await db.collection('users').findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is requesting their own data or if they're an admin
        const isOwner = userId.equals(requestingUserId);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
        }

        // Different projection based on whether it's the owner or admin
        let projection = { password: 0 }; // Always exclude password

        if (!isOwner && isAdmin) {
            // Admin viewing other user - might want to limit some fields
            projection = {
                password: 0
                // Could add other sensitive fields admins shouldn't see
            };
        }

        // Exclude password field using MongoDB projection
        const filteredUser = await db.collection('users').findOne(
            { _id: userId },
            { projection: projection } // 0 means exclude
        );

        res.status(200).json(filteredUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST create new user
router.post('/', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            passwordConfirm, // eslint-disable-line no-unused-vars
            dateOfBirth,
            gender,
            height,
            weight,
            isTestUser
            // NOTE: Deliberately NOT extracting 'role' from req.body
            // This prevents users from setting their own role during registration
        } = req.body;

        // Validate input
        const validationErrors = validateUserForCreation(req.body);
        if (validationErrors.length > 0) {
            console.log(validationErrors);
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Normalize email
        const normalizedEmail = normalizeEmail(email);

        // Check if email already exists
        const db = mongodb.getDb().db('cse341-project2');
        const existingUser = await db.collection('users').findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Hash the password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = {
            firstName,
            lastName,
            email: normalizedEmail,
            password: hashedPassword,
            dateOfBirth: new Date(dateOfBirth),
            gender: gender.toUpperCase(),
            height: Number(height) || null,
            weight: Number(weight) || null,
            role: 'user', // Always hardcode to 'user' - never trust client input for roles
            emailVerified: false,
            isActive: true,
            isTestUser: isTestUser || false,
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(user);

        res.status(201).json({
            message: 'User created successfully',
            _id: result.insertedId
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// POST login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        const validationErrors = validateUserForLogin(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        const db = mongodb.getDb().db('cse341-project2');
        const normalizedEmail = normalizeEmail(email);

        // Find user by email (include password this time)
        const user = await db.collection('users').findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create JWT token
        const tokenPayload = {
            userId: user._id,
            email: user.email,
            role: user.role || 'user'
        };
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not found in the environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        const token = jwt.sign(tokenPayload, jwtSecret, {
            expiresIn: '2h',
            algorithm: 'HS256',
            issuer: 'cse341-project2'
        });

        //Return success response (exclude password from user data)
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role || 'user'
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// PUT update user
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);
        const requestingUserId = new ObjectId(req.user.userId);
        const { firstName, lastName, email, dateOfBirth, gender, height, weight } = req.body;

        const db = mongodb.getDb().db('cse341-project2');

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ _id: userId });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is updating their own data or if they're an admin
        const isOwner = userId.equals(requestingUserId);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
        }

        // Validate input
        const validationErrors = validateUserForUpdate(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Build update object with only provided fields
        const updateData = { updatedAt: new Date() };

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined) updateData.gender = gender.toUpperCase();
        if (height !== undefined) updateData.height = Number(height) || null;
        if (weight !== undefined) updateData.weight = Number(weight) || null;

        // Handle email separately to check for duplicates
        if (email !== undefined) {
            const normalizedEmail = normalizeEmail(email);

            // Check if email already exists (but not for this user)
            const emailExists = await db.collection('users').findOne({
                email: normalizedEmail,
                _id: { $ne: userId }
            });

            if (emailExists) {
                return res.status(409).json({ error: 'Email already exists' });
            }

            updateData.email = normalizedEmail;
        }

        const result = await db.collection('users').updateOne({ _id: userId }, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE user
// DELETE user
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);
        const requestingUserId = new ObjectId(req.user.userId);
        const db = mongodb.getDb().db('cse341-project2');

        // Check permissions FIRST - before revealing anything about user existence
        const isOwner = userId.equals(requestingUserId);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only delete your own account.' });
        }

        // Only now check if user exists (since they have permission)
        const userToDelete = await db.collection('users').findOne({ _id: userId });
        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user
        await db.collection('users').deleteOne({ _id: userId });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PATCH update user role - Admin only route
router.patch('/:id/role', authenticateToken, async (req, res) => {
    try {
        // Only admins can change roles
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        const userId = new ObjectId(req.params.id);
        const { role } = req.body;

        // Validate role
        const validRoles = ['user', 'admin']; // Define your valid roles
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                error: 'Invalid role',
                validRoles: validRoles
            });
        }

        const db = mongodb.getDb().db('cse341-project2');

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ _id: userId });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent admins from demoting themselves (optional safety check)
        const requestingUserId = new ObjectId(req.user.userId);
        if (userId.equals(requestingUserId) && role !== 'admin') {
            return res.status(400).json({ error: 'Cannot change your own admin role' });
        }

        const result = await db.collection('users').updateOne(
            { _id: userId },
            {
                $set: {
                    role: role,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: `User role updated to ${role} successfully`,
            userId: userId,
            newRole: role
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// GET current user profile
router.get('/profile/me', authenticateToken, async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const userId = new ObjectId(req.user.userId);

        const user = await db.collection('users').findOne({ _id: userId }, { projection: { password: 0 } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

module.exports = router;
