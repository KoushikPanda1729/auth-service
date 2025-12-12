import { checkSchema } from "express-validator";

export const registerValidator = checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
    },
});
