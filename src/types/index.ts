export interface RegisterBody {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface LoginBody {
    email: string;
    password: string;
}

export interface AuthPayload {
    sub: number;
    role: string;
    id?: number;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
