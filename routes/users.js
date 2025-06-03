const express = require('express');
const router = express.Router();
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');

// GET all users
router.get('/', async (req, res) => {
    try {
        const db = mongodb.getDb().db('fitness_tracker');
        const users = await db.collection('users').find().toArray();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
    try {
        const db = mongodb.getDb().db('fitness_tracker');
        const userId = new ObjectId(req.params.id);
        const user = await db.collection('users').findOne({ _id: userId });
        
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
        // Basic validation
        const { name, email, age, weight } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email' 
            });
        }

        // Check if email already exists
        const db = mongodb.getDb().db('fitness_tracker');
        const existingUser = await db.collection('users').findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const user = {
            name,
            email,
            age: Number(age) || null,
            weight: Number(weight) || null,
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(user);
        
        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertedId 
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
        const { name, email, age, weight } = req.body;
        
        // Basic validation
        if (!name || !email) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email' 
            });
        }

        // Check if email already exists (but not for this user)
        const db = mongodb.getDb().db('fitness_tracker');
        const existingUser = await db.collection('users').findOne({ 
            email, 
            _id: { $ne: userId } 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const updatedUser = {
            name,
            email,
            age: Number(age) || null,
            weight: Number(weight) || null,
            updatedAt: new Date()
        };

        const result = await db.collection('users').updateOne(
            { _id: userId },
            { $set: updatedUser }
        );

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
        const db = mongodb.getDb().db('fitness_tracker');
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