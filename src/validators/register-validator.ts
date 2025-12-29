import { checkSchema } from "express-validator";
import { roles } from "../constants";

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
    role: {
        optional: true,
        trim: true,
        isIn: {
            options: [[roles.ADMIN, roles.MANAGER, roles.CUSTOMER]],
            errorMessage: `Role must be one of: ${roles.ADMIN}, ${roles.MANAGER}, ${roles.CUSTOMER}`,
        },
    },
    tenantId: {
        optional: true,
        isInt: {
            errorMessage: "Tenant ID must be a valid integer",
        },
        toInt: true,
        custom: {
            options: (value, { req }) => {
                const role = (req.body as { role?: string }).role;
                // If role is manager, tenantId is required
                if (role === roles.MANAGER && !value) {
                    throw new Error("Tenant ID is required for manager role");
                }
                // If role is admin or customer, tenantId should not be provided
                if (
                    (role === roles.ADMIN || role === roles.CUSTOMER) &&
                    value
                ) {
                    throw new Error(
                        "Tenant ID should not be provided for admin or customer role"
                    );
                }
                return true;
            },
        },
    },
});
