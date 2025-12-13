import { checkSchema } from "express-validator";

export const loginValidator = checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },
    password: {
        errorMessage: "Password is required",
        notEmpty: true,
    },
});
