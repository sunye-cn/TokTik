import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Video } from "../entity/Video";
import { User } from "../entity/User";
import { Like } from "../entity/Like";
import { Follow } from "../entity/Follow";
import { ILike, MoreThan } from "typeorm";
import * as jwt from "jsonwebtoken";

export class VideoController {

    static listAll = async (req: Request, res: Response) => {
        const videoRepository = AppDataSource.getRepository(Video);
        const { sort, category, search, page, limit } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        let order: any = { createdAt: "DESC" };
        if (sort === "views") order = { views: "DESC" };
        else if (sort === "likes") order = { likes: { id: "DESC" } }; // Approximation, ideally count
        else if (sort === "title") order = { title: "ASC" };

        let where: any = [];
        const searchTerm = search ? `%${search}%` : null;

        if (searchTerm) {
            if (category) {
                where = [
                    { category: category, title: ILike(searchTerm) },
                    { category: category, description: ILike(searchTerm) }
                ];
            } else {
                where = [
                    { title: ILike(searchTerm) },
                    { description: ILike(searchTerm) },
                    { category: ILike(searchTerm) }
                ];
            }
        } else {
            if (category) {
                where = { category: category };
            } else {
                where = {};
            }
        }

        const videos = await videoRepository.find({
            where,
            relations: ["user", "likes", "likes.user", "comments", "danmakus"],
            order,
            skip,
            take: limitNum
        });
        
        // If sorting by likes count is needed properly, we might need query builder, 
        // but for now let's stick to simple find or sort in memory if dataset is small.
        // TypeORM find options for relation count sorting is tricky.
        if (sort === "likes") {
            videos.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }

        res.send(videos);
    };

    static getOneById = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const videoRepository = AppDataSource.getRepository(Video);
        const followRepository = AppDataSource.getRepository(Follow);
        try {
            const video = await videoRepository.findOneOrFail({ 
                where: { id },
                relations: ["user", "likes", "likes.user", "comments", "comments.user", "danmakus", "danmakus.user"]
            });
            
            // Handle view counting logic
            let isAuthor = false;
            let isFollower = false;

            const token = req.headers["auth"] as string;
            if (token) {
                try {
                    const jwtPayload = <any>jwt.verify(token, process.env.JWT_SECRET || "secret");
                    const userId = jwtPayload.userId;

                    if (userId === video.user.id) {
                        isAuthor = true;
                    } else {
                        const follow = await followRepository.findOne({
                            where: {
                                follower: { id: userId },
                                following: { id: video.user.id }
                            }
                        });
                        if (follow) {
                            isFollower = true;
                        }
                    }
                } catch (e) {
                    // Invalid token, treat as anonymous
                }
            }

            // Increment views
            video.views = (video.views || 0) + 1;
            if (isAuthor) {
                video.authorViews = (video.authorViews || 0) + 1;
            } else if (isFollower) {
                video.followerViews = (video.followerViews || 0) + 1;
            }
            
            await videoRepository.save(video);

            const newFollowersCount = await followRepository.count({
                where: {
                    following: { id: video.user.id },
                    createdAt: MoreThan(video.createdAt)
                }
            });

            // Calculate Fan View %
            // Exclude author views from the denominator
            const validViews = Math.max(0, video.views - (video.authorViews || 0));
            let fanViewPercent = 0;
            if (validViews > 0) {
                fanViewPercent = ((video.followerViews || 0) / validViews) * 100;
            }

            res.send({ ...video, newFollowersCount, fanViewPercent: fanViewPercent.toFixed(2) });
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

        const { title, description, category } = req.body;
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
        video.category = category || "Life";
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

    static update = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const { title, description, category } = req.body;
        const userId = res.locals.jwtPayload.userId;

        const videoRepository = AppDataSource.getRepository(Video);
        try {
            const video = await videoRepository.findOneOrFail({ where: { id }, relations: ["user"] });
            
            if (video.user.id !== userId) {
                res.status(403).send("Not authorized to update this video");
                return;
            }

            video.title = title;
            video.description = description;
            if (category) video.category = category;

            await videoRepository.save(video);
            res.send(video);
        } catch (error) {
            res.status(404).send("Video not found");
        }
    };

    static delete = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userId = res.locals.jwtPayload.userId;
        
        const videoRepository = AppDataSource.getRepository(Video);
        let video: Video;
        try {
            video = await videoRepository.findOneOrFail({ where: { id }, relations: ["user"] });
            
            if (video.user.id !== userId) {
                res.status(403).send("Not authorized to delete this video");
                return;
            }
        } catch (error) {
            res.status(404).send("Video not found");
            return;
        }
        
        await videoRepository.remove(video);
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
