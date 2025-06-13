// Validators

const validateName = (name, fieldName) => {
    if (!name) {
        return `${fieldName} is required`;
    }

    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'.]+$/;
    if (!nameRegex.test(name)) {
        return `${fieldName} contains invalid characters`;
    }

    if (name.length > 50) {
        return `${fieldName} must be 50 characters or less`;
    }

    return null;
};

const validateEmail = (email) => {
    if (!email) {
        return 'Email is required';
    }

    if (email.length > 254) {
        return 'Email is too long (max 254 characters)';
    }

    const emailRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.([a-zA-Z]{2,})$/;

    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }

    if (email.includes('..') || email.includes('.-') || email.includes('-.')) {
        return 'Email contains invalid consecutive special characters';
    }

    if (email.startsWith('.') || email.startsWith('-') || email.endsWith('.') || email.endsWith('-')) {
        return 'Email cannot start or end with dots or hyphens';
    }

    return null;
};

const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) {
        return 'Date of birth is required';
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
        return 'Invalid date of birth format';
    }

    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (dob > today || age > 120 || age < 13) {
        return 'Date of birth must be between 13 and 120 years ago';
    }

    return null;
};

const validateGender = (gender) => {
    if (!gender) {
        return 'Gender is required';
    }

    if (!['M', 'F'].includes(gender.toUpperCase())) {
        return 'Gender must be M or F';
    }

    return null;
};

const validateHeight = (height) => {
    if (height !== undefined && height !== null && height !== '') {
        const heightNum = Number(height);
        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
            return 'Height must be between 50 and 300 cm';
        }
    }
    return null;
};

const validateWeight = (weight) => {
    if (weight !== undefined && weight !== null && weight !== '') {
        const weightNum = Number(weight);
        if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
            return 'Weight must be between 20 and 500 kg';
        }
    }
    return null;
};

const validatePassword = (password, passwordConfirm) => {
    if (!password) {
        return 'Password is required';
    }

    if (!passwordConfirm) {
        return 'Password confirmation is required';
    }

    if (password !== passwordConfirm) {
        return 'Passwords do not match';
    }

    return null;
};

const validateUserForCreation = (userData) => {
    const errors = [];
    const { firstName, lastName, email, password, passwordConfirm, dateOfBirth, gender, height, weight } = userData;

    // Required field validations
    const firstNameError = validateName(firstName, 'First name');
    if (firstNameError) errors.push(firstNameError);

    const lastNameError = validateName(lastName, 'Last name');
    if (lastNameError) errors.push(lastNameError);

    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);

    const passwordError = validatePassword(password, passwordConfirm);
    if (passwordError) errors.push(passwordError);

    const dobError = validateDateOfBirth(dateOfBirth);
    if (dobError) errors.push(dobError);

    const genderError = validateGender(gender);
    if (genderError) errors.push(genderError);

    // Optional field validations
    const heightError = validateHeight(height);
    if (heightError) errors.push(heightError);

    const weightError = validateWeight(weight);
    if (weightError) errors.push(weightError);

    return errors;
};

const validateUserForUpdate = (userData) => {
    const errors = [];
    const { firstName, lastName, email, dateOfBirth, gender, height, weight } = userData;

    // Only validate provided fields for updates
    if (firstName !== undefined) {
        const firstNameError = validateName(firstName, 'First name');
        if (firstNameError) errors.push(firstNameError);
    }

    if (lastName !== undefined) {
        const lastNameError = validateName(lastName, 'Last name');
        if (lastNameError) errors.push(lastNameError);
    }

    if (email !== undefined) {
        const emailError = validateEmail(email);
        if (emailError) errors.push(emailError);
    }

    if (dateOfBirth !== undefined) {
        const dobError = validateDateOfBirth(dateOfBirth);
        if (dobError) errors.push(dobError);
    }

    if (gender !== undefined) {
        const genderError = validateGender(gender);
        if (genderError) errors.push(genderError);
    }

    if (height !== undefined) {
        const heightError = validateHeight(height);
        if (heightError) errors.push(heightError);
    }

    if (weight !== undefined) {
        const weightError = validateWeight(weight);
        if (weightError) errors.push(weightError);
    }

    return errors;
};

const normalizeEmail = (email) => {
    return email ? email.toLowerCase().trim() : '';
};

const validateUserForLogin = (userData) => {
    const errors = [];
    const { email, password } = userData;

    if (!email) {
        errors.push('Email is required');
    } else {
        const emailError = validateEmail(email);
        if (emailError) errors.push(emailError);
    }

    if (!password) {
        errors.push('Password is required');
    }

    return errors;
};

module.exports = {
    validateUserForCreation,
    validateUserForUpdate,
    normalizeEmail,
    validateName,
    validateEmail,
    validateDateOfBirth,
    validateGender,
    validateHeight,
    validateWeight,
    validatePassword,
    validateUserForLogin
};
