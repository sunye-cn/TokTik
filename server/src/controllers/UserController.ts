import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

export class UserController {

    static getOneById = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({ 
                where: { id },
                select: ["id", "username", "createdAt"] // Don't return password
            });
            res.send(user);
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static getVideosByUser = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);
        
        try {
            const user = await userRepository.findOneOrFail({ 
                where: { id },
                relations: ["videos"]
            });
            res.send(user.videos);
        } catch (error) {
            res.status(404).send("User not found");
        }
    };
}
