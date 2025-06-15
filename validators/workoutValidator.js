const { ObjectId } = require('mongodb');

// Individual field validators
const validateUserId = (userId) => {
    if (!userId) {
        return 'User ID is required';
    }

    if (!ObjectId.isValid(userId)) {
        return 'Invalid user ID format';
    }

    return null;
};

const validateWorkoutName = (workoutName) => {
    if (!workoutName) {
        return 'Workout name is required';
    }

    if (typeof workoutName !== 'string') {
        return 'Workout name must be a string';
    }

    const trimmedName = workoutName.trim();
    if (trimmedName.length === 0) {
        return 'Workout name cannot be empty';
    }

    if (trimmedName.length > 100) {
        return 'Workout name must be 100 characters or less';
    }

    // Allow letters, numbers, spaces, and common punctuation
    const nameRegex = /^[a-zA-Z0-9\s\-_.(),!&]+$/;
    if (!nameRegex.test(trimmedName)) {
        return 'Workout name contains invalid characters';
    }

    return null;
};

const validateDate = (date) => {
    if (!date) {
        return 'Date is required';
    }

    const workoutDate = new Date(date);
    if (isNaN(workoutDate.getTime())) {
        return 'Invalid date format';
    }

    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    if (workoutDate < oneYearAgo || workoutDate > oneYearFromNow) {
        return 'Date must be within one year of today';
    }

    return null;
};

const validateDuration = (duration) => {
    if (duration === undefined || duration === null) {
        return 'Duration is required';
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum)) {
        return 'Duration must be a number';
    }

    if (durationNum <= 0) {
        return 'Duration must be greater than 0';
    }

    if (durationNum > 1440) { // 24 hours in minutes
        return 'Duration cannot exceed 24 hours (1440 minutes)';
    }

    if (!Number.isInteger(durationNum)) {
        return 'Duration must be a whole number (minutes)';
    }

    return null;
};

const validateCaloriesBurned = (calories) => {
    if (calories === undefined || calories === null) {
        return 'Calories burned is required';
    }

    const caloriesNum = Number(calories);
    if (isNaN(caloriesNum)) {
        return 'Calories burned must be a number';
    }

    if (caloriesNum < 0) {
        return 'Calories burned cannot be negative';
    }

    if (caloriesNum > 10000) {
        return 'Calories burned cannot exceed 10,000';
    }

    if (!Number.isInteger(caloriesNum)) {
        return 'Calories burned must be a whole number';
    }

    return null;
};

const validateExerciseType = (exerciseType) => {
    if (!exerciseType) {
        return 'Exercise type is required';
    }

    if (typeof exerciseType !== 'string') {
        return 'Exercise type must be a string';
    }

    const trimmedType = exerciseType.trim();
    if (trimmedType.length === 0) {
        return 'Exercise type cannot be empty';
    }

    if (trimmedType.length > 50) {
        return 'Exercise type must be 50 characters or less';
    }

    // Valid exercise types (can be expanded)
    const validTypes = [
        'CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE', 'SPORTS',
        'RUNNING', 'CYCLING', 'SWIMMING', 'WALKING', 'WEIGHTLIFTING',
        'YOGA', 'PILATES', 'CROSSFIT', 'BASKETBALL', 'FOOTBALL',
        'TENNIS', 'BOXING', 'MARTIAL_ARTS', 'DANCING', 'HIKING',
        'CLIMBING', 'ROWING', 'OTHER'
    ];

    const normalizedType = trimmedType.toUpperCase().replace(/\s+/g, '_');
    if (!validTypes.includes(normalizedType)) {
        return `Exercise type must be one of: ${validTypes.join(', ')}`;
    }

    return null;
};

const validateNotes = (notes) => {
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string') {
            return 'Notes must be a string';
        }

        if (notes.length > 1000) {
            return 'Notes must be 1000 characters or less';
        }
    }

    return null;
};

const validatePaginationParams = (page, limit) => {
    const errors = [];

    if (page < 1) {
        errors.push('Page must be 1 or greater');
    }

    if (limit < 1) {
        errors.push('Limit must be 1 or greater');
    }

    if (limit > 100) {
        errors.push('Limit cannot exceed 100');
    }

    return errors;
};

const validateDateRange = (startDate, endDate) => {
    const errors = [];

    if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            errors.push('Invalid start date format');
        }
    }

    if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
            errors.push('Invalid end date format');
        }
    }

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            errors.push('Start date cannot be after end date');
        }
    }

    return errors;
};

// Main validation functions
const validateWorkoutForCreation = (workoutData) => {
    const errors = [];
    const { userId, workoutName, date, duration, caloriesBurned, exerciseType, notes } = workoutData;

    // Required field validations
    const userIdError = validateUserId(userId);
    if (userIdError) errors.push(userIdError);

    const workoutNameError = validateWorkoutName(workoutName);
    if (workoutNameError) errors.push(workoutNameError);

    const dateError = validateDate(date);
    if (dateError) errors.push(dateError);

    const durationError = validateDuration(duration);
    if (durationError) errors.push(durationError);

    const caloriesError = validateCaloriesBurned(caloriesBurned);
    if (caloriesError) errors.push(caloriesError);

    const exerciseTypeError = validateExerciseType(exerciseType);
    if (exerciseTypeError) errors.push(exerciseTypeError);

    // Optional field validation
    const notesError = validateNotes(notes);
    if (notesError) errors.push(notesError);

    return errors;
};

const validateWorkoutForUpdate = (workoutData) => {
    const errors = [];
    const { userId, workoutName, date, duration, caloriesBurned, exerciseType, notes } = workoutData;

    // Only validate provided fields for updates
    if (userId !== undefined) {
        const userIdError = validateUserId(userId);
        if (userIdError) errors.push(userIdError);
    }

    if (workoutName !== undefined) {
        const workoutNameError = validateWorkoutName(workoutName);
        if (workoutNameError) errors.push(workoutNameError);
    }

    if (date !== undefined) {
        const dateError = validateDate(date);
        if (dateError) errors.push(dateError);
    }

    if (duration !== undefined) {
        const durationError = validateDuration(duration);
        if (durationError) errors.push(durationError);
    }

    if (caloriesBurned !== undefined) {
        const caloriesError = validateCaloriesBurned(caloriesBurned);
        if (caloriesError) errors.push(caloriesError);
    }

    if (exerciseType !== undefined) {
        const exerciseTypeError = validateExerciseType(exerciseType);
        if (exerciseTypeError) errors.push(exerciseTypeError);
    }

    if (notes !== undefined) {
        const notesError = validateNotes(notes);
        if (notesError) errors.push(notesError);
    }

    return errors;
};

const normalizeWorkoutData = (workoutData) => {
    const normalized = {};

    if (workoutData.userId !== undefined) {
        normalized.userId = workoutData.userId.toString();
    }

    if (workoutData.workoutName !== undefined) {
        normalized.workoutName = workoutData.workoutName.trim();
    }

    if (workoutData.date !== undefined) {
        normalized.date = new Date(workoutData.date);
    }

    if (workoutData.duration !== undefined) {
        normalized.duration = Number(workoutData.duration);
    }

    if (workoutData.caloriesBurned !== undefined) {
        normalized.caloriesBurned = Number(workoutData.caloriesBurned);
    }

    if (workoutData.exerciseType !== undefined) {
        normalized.exerciseType = workoutData.exerciseType.trim().toUpperCase().replace(/\s+/g, '_');
    }

    if (workoutData.notes !== undefined) {
        normalized.notes = workoutData.notes ? workoutData.notes.trim() : '';
    }

    return normalized;
};

module.exports = {
    validateWorkoutForCreation,
    validateWorkoutForUpdate,
    validatePaginationParams,
    validateDateRange,
    normalizeWorkoutData,
    validateUserId,
    validateWorkoutName,
    validateDate,
    validateDuration,
    validateCaloriesBurned,
    validateExerciseType,
    validateNotes
};