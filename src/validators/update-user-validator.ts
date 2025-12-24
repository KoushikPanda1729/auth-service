import { checkSchema } from "express-validator";
import { roles } from "../constants";

export const updateUserValidator = checkSchema({
    firstName: {
        optional: true,
        errorMessage: "First name must be a string",
        notEmpty: {
            errorMessage: "First name cannot be empty",
        },
        trim: true,
    },
    lastName: {
        optional: true,
        errorMessage: "Last name must be a string",
        notEmpty: {
            errorMessage: "Last name cannot be empty",
        },
        trim: true,
    },
    email: {
        optional: true,
        trim: true,
        isEmail: {
            errorMessage: "Invalid email format",
        },
    },
    role: {
        optional: true,
        trim: true,
        notEmpty: {
            errorMessage: "Role cannot be empty",
        },
        isIn: {
            options: [[roles.ADMIN, roles.MANAGER, roles.CUSTOMER]],
            errorMessage: `Role must be one of: ${roles.ADMIN}, ${roles.MANAGER}, ${roles.CUSTOMER}`,
        },
    },
});
