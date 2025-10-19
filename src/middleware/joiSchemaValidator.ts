import type { Request, Response, NextFunction } from "express";
import { type ObjectSchema } from "joi";

export const joiSchemaValidator = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            res.status(400).json({
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
            return;
        }

        next();
    };
};
