import { checkSchema } from "express-validator";

export const registerValidator = checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },
    firstName: {
        errorMessage: "First name is required",
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: "Last name is required",
        notEmpty: true,
        trim: true,
    },
    password: {
        errorMessage: "Password is required",
        notEmpty: true,
        isLength: {
            options: { min: 8 },
            errorMessage: "Password should be at least 8 chars",
        },
        isStrongPassword: {
            options: {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            },
            errorMessage:
                "Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character",
        },
    },
});
