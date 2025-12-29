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
    tenantId: {
        optional: true,
        custom: {
            options: (value, { req }) => {
                const role = (req.body as { role?: string }).role;

                // If role is being changed to manager, tenantId is required
                if (role === roles.MANAGER && value === null) {
                    throw new Error(
                        "Tenant ID is required when role is manager"
                    );
                }

                // If tenantId is provided, it should be a valid integer or null
                if (value !== null && value !== undefined) {
                    if (
                        !Number.isInteger(Number(value)) ||
                        Number(value) <= 0
                    ) {
                        throw new Error(
                            "Tenant ID must be a valid positive integer"
                        );
                    }
                }

                return true;
            },
        },
        toInt: true,
    },
});
