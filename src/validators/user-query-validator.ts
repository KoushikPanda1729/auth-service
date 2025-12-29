import { checkSchema } from "express-validator";
import { roles } from "../constants";

export const userQueryValidator = checkSchema(
    {
        page: {
            in: ["query"],
            optional: true,
            isInt: {
                options: { min: 1 },
                errorMessage: "Page must be a positive integer",
            },
            toInt: true,
        },
        limit: {
            in: ["query"],
            optional: true,
            isInt: {
                options: { min: 1, max: 100 },
                errorMessage: "Limit must be between 1 and 100",
            },
            toInt: true,
        },
        offset: {
            in: ["query"],
            optional: true,
            isInt: {
                options: { min: 0 },
                errorMessage: "Offset must be a non-negative integer",
            },
            toInt: true,
        },
        search: {
            in: ["query"],
            optional: true,
            trim: true,
            isLength: {
                options: { min: 1, max: 100 },
                errorMessage:
                    "Search query must be between 1 and 100 characters",
            },
        },
        role: {
            in: ["query"],
            optional: true,
            trim: true,
            isIn: {
                options: [[roles.ADMIN, roles.MANAGER, roles.CUSTOMER]],
                errorMessage: `Role must be one of: ${roles.ADMIN}, ${roles.MANAGER}, ${roles.CUSTOMER}`,
            },
        },
    },
    ["query"]
);
