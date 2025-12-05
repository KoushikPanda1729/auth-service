import { type Request, type Response } from "express";
export class AuthController {
    register(req: Request, res: Response) {
        res.status(201).json();
    }
}
