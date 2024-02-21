import 'dotenv/config'
import { NextFunction, Request, Response } from 'express';
import { auth } from "express-oauth2-jwt-bearer";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from '../models/user';

declare global {
    namespace Express {
        interface Request {
            userId: string;
            auth0Id: string;
        }
    }
}

export const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGNING_ALG
});

export const jwtParse = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.sendStatus(401)
    }

    const accessToken = authorization.split(" ")[0];

    try {
        const decoded = jwt.decode(accessToken) as JwtPayload;
        const auth0Id = decoded.sub;

        const user = await User.findOne({ auth0Id });

        if (!user) return res.sendStatus(404);

        req.userId = user._id.toString();
        req.auth0Id = auth0Id as string

        next();
    } catch (error) {
        return res.sendStatus(401)
    }
}