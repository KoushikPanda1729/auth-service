import { checkSchema } from "express-validator";

export const tenantQueryValidator = checkSchema(
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
    },
    ["query"]
);
