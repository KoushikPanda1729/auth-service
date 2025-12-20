import { checkSchema } from "express-validator";

export const createTenantValidator = checkSchema({
    name: {
        trim: true,
        notEmpty: {
            errorMessage: "Name is required",
        },
        isLength: {
            options: { max: 100 },
            errorMessage: "Name must not exceed 100 characters",
        },
    },
    address: {
        trim: true,
        notEmpty: {
            errorMessage: "Address is required",
        },
        isLength: {
            options: { max: 200 },
            errorMessage: "Address must not exceed 200 characters",
        },
    },
});
