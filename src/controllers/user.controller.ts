import { Request, Response } from "express";
import User from "../models/user";

const createUser = async (req: Request, res: Response) => {
    try {
        const { auth0Id } = req.body;
        const existingUser = await User.findOne({ auth0Id });

        if (existingUser) return res.status(200).send();

        const newUser = new User(req.body);
        await newUser.save();

        return res.status(201).json(newUser.toObject());
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to create user"
        })
    }
}

export default {
    createUser
}