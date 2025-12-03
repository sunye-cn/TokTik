import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Video } from "../entity/Video";
import { User } from "../entity/User";
import { Like } from "../entity/Like";

export class VideoController {

    static listAll = async (req: Request, res: Response) => {
        const videoRepository = AppDataSource.getRepository(Video);
        const videos = await videoRepository.find({
            relations: ["user", "likes", "likes.user"],
            order: { createdAt: "DESC" }
        });
        res.send(videos);
    };

    static getOneById = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const videoRepository = AppDataSource.getRepository(Video);
        try {
            const video = await videoRepository.findOneOrFail({ 
                where: { id },
                relations: ["user", "likes", "likes.user"]
            });
            res.send(video);
        } catch (error) {
            res.status(404).send("Video not found");
        }
    };

    static upload = async (req: Request, res: Response) => {
        // req.file is handled by multer middleware in the route
        if (!req.file) {
            res.status(400).send("No video file uploaded");
            return;
        }

        const { title, description } = req.body;
        const userId = res.locals.jwtPayload.userId;

        const userRepository = AppDataSource.getRepository(User);
        let user;
        try {
            user = await userRepository.findOneOrFail({ where: { id: userId } });
        } catch (error) {
            res.status(404).send("User not found");
            return;
        }

        const video = new Video();
        video.title = title;
        video.description = description;
        // Normalize path for URL usage
        video.url = req.file.path.replace(/\\/g, "/"); 
        video.user = user;

        const videoRepository = AppDataSource.getRepository(Video);
        try {
            await videoRepository.save(video);
        } catch (e) {
            res.status(500).send("Error saving video");
            return;
        }

        res.status(201).send(video);
    };

    static delete = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userId = res.locals.jwtPayload.userId;
        
        const videoRepository = AppDataSource.getRepository(Video);
        let video: Video;
        try {
            video = await videoRepository.findOneOrFail({ where: { id }, relations: ["user"] });
        } catch (error) {
            res.status(404).send("Video not found");
            return;
        }

        if (video.user.id !== userId) {
            res.status(403).send("Not authorized to delete this video");
            return;
        }

        videoRepository.delete(id);
        res.status(204).send();
    };

    static like = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userId = res.locals.jwtPayload.userId;

        const likeRepository = AppDataSource.getRepository(Like);
        const videoRepository = AppDataSource.getRepository(Video);
        const userRepository = AppDataSource.getRepository(User);

        let video;
        try {
            video = await videoRepository.findOneOrFail({ where: { id } });
        } catch (error) {
            res.status(404).send("Video not found");
            return;
        }

        let user;
        try {
            user = await userRepository.findOneOrFail({ where: { id: userId } });
        } catch (error) {
            res.status(404).send("User not found");
            return;
        }

        const existingLike = await likeRepository.findOne({
            where: {
                user: { id: userId },
                video: { id: id }
            }
        });

        if (existingLike) {
            res.status(409).send("Already liked");
            return;
        }

        const like = new Like();
        like.user = user;
        like.video = video;

        await likeRepository.save(like);
        res.status(201).send("Liked");
    };

    static unlike = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userId = res.locals.jwtPayload.userId;

        const likeRepository = AppDataSource.getRepository(Like);

        const existingLike = await likeRepository.findOne({
            where: {
                user: { id: userId },
                video: { id: id }
            }
        });

        if (!existingLike) {
            res.status(404).send("Like not found");
            return;
        }

        await likeRepository.remove(existingLike);
        res.status(204).send();
    };
}
