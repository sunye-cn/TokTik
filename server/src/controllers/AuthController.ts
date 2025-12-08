import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthController {
    static register = async (req: Request, res: Response) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).send("Username and password are required");
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        
        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { username } });
        if (existingUser) {
            res.status(409).send("Username already in use");
            return;
        }

        const user = new User();
        user.username = username;
        user.nickname = username;
        user.password = bcrypt.hashSync(password, 10);

        try {
            await userRepository.save(user);
        } catch (e) {
            res.status(500).send("Error creating user");
            return;
        }

        res.status(201).send("User created");
    };

    static login = async (req: Request, res: Response) => {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).send("Username and password are required");
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        let user: User | null;

        try {
            user = await userRepository.findOne({ where: { username } });
        } catch (error) {
            res.status(500).send();
            return;
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            res.status(401).send("Invalid credentials");
            return;
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1h" }
        );

        res.send({ token, username: user.username, nickname: user.nickname, userId: user.id });
    };

    static resetPassword = async (req: Request, res: Response) => {
        const { username, newPassword } = req.body;
        if (!username || !newPassword) {
            res.status(400).send("Username and new password are required");
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        let user: User | null;

        try {
            user = await userRepository.findOne({ where: { username } });
        } catch (error) {
            res.status(500).send("Error finding user");
            return;
        }

        if (!user) {
            res.status(404).send("User not found");
            return;
        }

        user.password = bcrypt.hashSync(newPassword, 10);

        try {
            await userRepository.save(user);
        } catch (e) {
            res.status(500).send("Error updating password");
            return;
        }

        res.status(200).send("Password updated successfully");
    };
}
