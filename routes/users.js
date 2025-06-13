const express = require('express');
const router = express.Router();
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { validateUserForCreation, validateUserForUpdate, normalizeEmail } = require('../validators/userValidator');

// GET all users
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const userId = new ObjectId(req.params.id);

        // Exclude password field using MongoDB projection
        const user = await db.collection('users').findOne(
            { _id: userId },
            { projection: { password: 0 } } // 0 means exclude
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
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
            passwordConfirm,
            dateOfBirth,
            gender,
            height,
            weight,
            isTestUser
        } = req.body;

        // Validate input
        const validationErrors = validateUserForCreation(req.body);
        if (validationErrors.length > 0) {
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
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
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
            role: 'user',
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

// PUT update user
router.put('/:id', async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);
        const { firstName, lastName, email, dateOfBirth, gender, height, weight } = req.body;

        // Validate input
        const validationErrors = validateUserForUpdate(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        const db = mongodb.getDb().db('cse341-project2');

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ _id: userId });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
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
router.delete('/:id', async (req, res) => {
    try {
        const userId = new ObjectId(req.params.id);
        const db = mongodb.getDb().db('cse341-project2');
        const result = await db.collection('users').deleteOne({ _id: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
