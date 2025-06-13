const express = require('express');
const router = express.Router();
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');

// GET all workouts
router.get('/', async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const workouts = await db.collection('workouts').find().toArray();
        res.status(200).json(workouts);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// GET single workout by ID
router.get('/:id', async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const workoutId = new ObjectId(req.params.id);
        const workout = await db.collection('workouts').findOne({ _id: workoutId });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.status(200).json(workout);
    } catch (error) {
        console.error('Error fetching workout:', error);
        res.status(500).json({ error: 'Failed to fetch workout' });
    }
});

// POST create new workout
router.post('/', async (req, res) => {
    try {
        // Basic validation
        const { userId, workoutName, date, duration, caloriesBurned, exerciseType, notes } = req.body;

        if (!userId || !workoutName || !date || !duration || !exerciseType) {
            return res.status(400).json({
                error: 'Missing required fields: userId, workoutName, date, duration, exerciseType'
            });
        }

        const workout = {
            userId,
            workoutName,
            date: new Date(date),
            duration: Number(duration),
            caloriesBurned: Number(caloriesBurned) || 0,
            exerciseType,
            notes: notes || '',
            createdAt: new Date()
        };

        const db = mongodb.getDb().db('cse341-project2');
        const result = await db.collection('workouts').insertOne(workout);

        res.status(201).json({
            message: 'Workout created successfully',
            workoutId: result.insertedId
        });
    } catch (error) {
        console.error('Error creating workout:', error);
        res.status(500).json({ error: 'Failed to create workout' });
    }
});

// PUT update workout
router.put('/:id', async (req, res) => {
    try {
        const workoutId = new ObjectId(req.params.id);
        const { userId, workoutName, date, duration, caloriesBurned, exerciseType, notes } = req.body;

        // Basic validation
        if (!userId || !workoutName || !date || !duration || !exerciseType) {
            return res.status(400).json({
                error: 'Missing required fields: userId, workoutName, date, duration, exerciseType'
            });
        }

        const updatedWorkout = {
            userId,
            workoutName,
            date: new Date(date),
            duration: Number(duration),
            caloriesBurned: Number(caloriesBurned) || 0,
            exerciseType,
            notes: notes || '',
            updatedAt: new Date()
        };

        const db = mongodb.getDb().db('cse341-project2');
        const result = await db.collection('workouts').updateOne({ _id: workoutId }, { $set: updatedWorkout });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.status(200).json({ message: 'Workout updated successfully' });
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

// DELETE workout
router.delete('/:id', async (req, res) => {
    try {
        const workoutId = new ObjectId(req.params.id);
        const db = mongodb.getDb().db('cse341-project2');
        const result = await db.collection('workouts').deleteOne({ _id: workoutId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.status(200).json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

module.exports = router;
