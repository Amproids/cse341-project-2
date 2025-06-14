const express = require('express');
const router = express.Router();
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');
const {
    validateWorkoutForCreation,
    validateWorkoutForUpdate,
    validatePaginationParams,
    validateDateRange,
    normalizeWorkoutData
} = require('../validators/workoutValidator');

// GET all workouts - with authentication and filtering
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const requestingUserId = new ObjectId(req.user.userId);
        const isAdmin = req.user.role === 'admin';

        // Validate pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const paginationErrors = validatePaginationParams(page, limit);
        if (paginationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: paginationErrors
            });
        }

        let query = {};
        
        // Regular users can only see their own workouts
        if (!isAdmin) {
            query.userId = requestingUserId.toString();
        }

        // Optional filtering by userId for admins
        if (isAdmin && req.query.userId) {
            if (!ObjectId.isValid(req.query.userId)) {
                return res.status(400).json({ error: 'Invalid userId format' });
            }
            query.userId = req.query.userId;
        }

        // Optional filtering by date range
        if (req.query.startDate || req.query.endDate) {
            const dateErrors = validateDateRange(req.query.startDate, req.query.endDate);
            if (dateErrors.length > 0) {
                return res.status(400).json({
                    error: 'Date validation failed',
                    details: dateErrors
                });
            }

            query.date = {};
            if (req.query.startDate) {
                query.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.date.$lte = new Date(req.query.endDate);
            }
        }

        // Optional filtering by exercise type
        if (req.query.exerciseType) {
            query.exerciseType = { $regex: req.query.exerciseType, $options: 'i' };
        }

        // Pagination
        const skip = (page - 1) * limit;

        const workouts = await db
            .collection('workouts')
            .find(query)
            .sort({ date: -1 }) // Most recent first
            .skip(skip)
            .limit(limit)
            .toArray();

        // Get total count for pagination info
        const totalCount = await db.collection('workouts').countDocuments(query);

        res.status(200).json({
            workouts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalWorkouts: totalCount,
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// GET single workout by ID - with authentication and authorization
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid workout ID format' });
        }

        const db = mongodb.getDb().db('cse341-project2');
        const workoutId = new ObjectId(req.params.id);
        const requestingUserId = new ObjectId(req.user.userId);
        const isAdmin = req.user.role === 'admin';

        const workout = await db.collection('workouts').findOne({ _id: workoutId });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // Check if user owns this workout or is admin
        const workoutUserId = new ObjectId(workout.userId);
        const isOwner = workoutUserId.equals(requestingUserId);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only view your own workouts.' });
        }

        res.status(200).json(workout);
    } catch (error) {
        console.error('Error fetching workout:', error);
        res.status(500).json({ error: 'Failed to fetch workout' });
    }
});

// POST create new workout - with authentication and validation
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Validate input
        const validationErrors = validateWorkoutForCreation(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        const { userId } = req.body;
        const requestingUserId = new ObjectId(req.user.userId);
        const workoutUserId = new ObjectId(userId);
        const isAdmin = req.user.role === 'admin';

        // Check if user can create workout for this userId
        if (!workoutUserId.equals(requestingUserId) && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only create workouts for yourself.' });
        }

        // Verify the target user exists
        const db = mongodb.getDb().db('cse341-project2');
        const targetUser = await db.collection('users').findOne({ _id: workoutUserId });
        if (!targetUser) {
            return res.status(400).json({ error: 'Target user does not exist' });
        }

        // Normalize and prepare workout data
        const normalizedData = normalizeWorkoutData(req.body);
        const workout = {
            userId: normalizedData.userId,
            workoutName: normalizedData.workoutName,
            date: normalizedData.date,
            duration: normalizedData.duration,
            caloriesBurned: normalizedData.caloriesBurned,
            exerciseType: normalizedData.exerciseType,
            notes: normalizedData.notes || '',
            createdAt: new Date(),
            createdBy: requestingUserId.toString()
        };

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

// PUT update workout - with authentication and authorization
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid workout ID format' });
        }

        const workoutId = new ObjectId(req.params.id);
        const requestingUserId = new ObjectId(req.user.userId);

        const db = mongodb.getDb().db('cse341-project2');

        // Check if workout exists
        const existingWorkout = await db.collection('workouts').findOne({ _id: workoutId });
        if (!existingWorkout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // Check authorization
        const existingWorkoutUserId = new ObjectId(existingWorkout.userId);
        const isOwner = existingWorkoutUserId.equals(requestingUserId);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only update your own workouts.' });
        }

        // Validate input
        const validationErrors = validateWorkoutForUpdate(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        const { userId } = req.body;

        // If userId is being changed, verify the new user exists and check permissions
        if (userId && userId !== existingWorkout.userId) {
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid userId format' });
            }

            const newUserId = new ObjectId(userId);
            
            // Only admins can reassign workouts to other users
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can reassign workouts to other users.' });
            }

            const targetUser = await db.collection('users').findOne({ _id: newUserId });
            if (!targetUser) {
                return res.status(400).json({ error: 'Target user does not exist' });
            }
        }

        // Normalize and build update object with only provided fields
        const normalizedData = normalizeWorkoutData(req.body);
        const updateData = { updatedAt: new Date() };

        if (normalizedData.userId !== undefined) updateData.userId = normalizedData.userId;
        if (normalizedData.workoutName !== undefined) updateData.workoutName = normalizedData.workoutName;
        if (normalizedData.date !== undefined) updateData.date = normalizedData.date;
        if (normalizedData.duration !== undefined) updateData.duration = normalizedData.duration;
        if (normalizedData.caloriesBurned !== undefined) updateData.caloriesBurned = normalizedData.caloriesBurned;
        if (normalizedData.exerciseType !== undefined) updateData.exerciseType = normalizedData.exerciseType;
        if (normalizedData.notes !== undefined) updateData.notes = normalizedData.notes;

        const result = await db.collection('workouts').updateOne(
            { _id: workoutId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.status(200).json({ message: 'Workout updated successfully' });
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

// DELETE workout - with authentication and authorization
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid workout ID format' });
        }

        const workoutId = new ObjectId(req.params.id);
        const requestingUserId = new ObjectId(req.user.userId);
        const db = mongodb.getDb().db('cse341-project2');

        // Get the workout first to check ownership
        const existingWorkout = await db.collection('workouts').findOne({ _id: workoutId });
        if (!existingWorkout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // Check authorization
        const workoutUserId = new ObjectId(existingWorkout.userId);
        const isOwner = workoutUserId.equals(requestingUserId);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. You can only delete your own workouts.' });
        }

        // Delete the workout
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

// GET user's workout statistics - authenticated users only
router.get('/stats/me', authenticateToken, async (req, res) => {
    try {
        const db = mongodb.getDb().db('cse341-project2');
        const requestingUserId = new ObjectId(req.user.userId);

        // Aggregation pipeline to get user's workout statistics
        const stats = await db.collection('workouts').aggregate([
            { $match: { userId: requestingUserId.toString() } },
            {
                $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    totalDuration: { $sum: '$duration' },
                    totalCalories: { $sum: '$caloriesBurned' },
                    averageDuration: { $avg: '$duration' },
                    averageCalories: { $avg: '$caloriesBurned' },
                    exerciseTypes: { $addToSet: '$exerciseType' }
                }
            }
        ]).toArray();

        // Get recent workouts (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentWorkouts = await db.collection('workouts').countDocuments({
            userId: requestingUserId.toString(),
            date: { $gte: sevenDaysAgo }
        });

        const result = stats.length > 0 ? {
            totalWorkouts: stats[0].totalWorkouts,
            totalDuration: stats[0].totalDuration,
            totalCalories: stats[0].totalCalories,
            averageDuration: Math.round(stats[0].averageDuration || 0),
            averageCalories: Math.round(stats[0].averageCalories || 0),
            exerciseTypes: stats[0].exerciseTypes,
            recentWorkouts: recentWorkouts
        } : {
            totalWorkouts: 0,
            totalDuration: 0,
            totalCalories: 0,
            averageDuration: 0,
            averageCalories: 0,
            exerciseTypes: [],
            recentWorkouts: 0
        };

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching workout statistics:', error);
        res.status(500).json({ error: 'Failed to fetch workout statistics' });
    }
});

// GET workout statistics for any user - Admin only
router.get('/stats/:userId', authenticateToken, async (req, res) => {
    try {
        // Only admins can view other users' statistics
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        const { userId } = req.params;
        
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const db = mongodb.getDb().db('cse341-project2');

        // Verify user exists
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get workout statistics for the specified user
        const stats = await db.collection('workouts').aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    totalDuration: { $sum: '$duration' },
                    totalCalories: { $sum: '$caloriesBurned' },
                    averageDuration: { $avg: '$duration' },
                    averageCalories: { $avg: '$caloriesBurned' },
                    exerciseTypes: { $addToSet: '$exerciseType' }
                }
            }
        ]).toArray();

        const result = stats.length > 0 ? {
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`,
            totalWorkouts: stats[0].totalWorkouts,
            totalDuration: stats[0].totalDuration,
            totalCalories: stats[0].totalCalories,
            averageDuration: Math.round(stats[0].averageDuration || 0),
            averageCalories: Math.round(stats[0].averageCalories || 0),
            exerciseTypes: stats[0].exerciseTypes
        } : {
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`,
            totalWorkouts: 0,
            totalDuration: 0,
            totalCalories: 0,
            averageDuration: 0,
            averageCalories: 0,
            exerciseTypes: []
        };

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching user workout statistics:', error);
        res.status(500).json({ error: 'Failed to fetch user workout statistics' });
    }
});

module.exports = router;