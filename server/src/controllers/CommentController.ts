import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Comment } from "../entity/Comment";
import { Video } from "../entity/Video";
import { User } from "../entity/User";

export class CommentController {
    static list = async (req: Request, res: Response) => {
        const videoId = parseInt(req.params.videoId);
        const commentRepository = AppDataSource.getRepository(Comment);
        
        try {
            const comments = await commentRepository.find({
                where: { video: { id: videoId } },
                relations: ["user"],
                order: { createdAt: "DESC" }
            });
            res.send(comments);
        } catch (error) {
            res.status(500).send("Error fetching comments");
        }
    };

    static create = async (req: Request, res: Response) => {
        const videoId = parseInt(req.params.videoId);
        const { content } = req.body;
        const userId = res.locals.jwtPayload.userId;

        if (!content) {
            res.status(400).send("Content is required");
            return;
        }

        const commentRepository = AppDataSource.getRepository(Comment);
        const videoRepository = AppDataSource.getRepository(Video);
        const userRepository = AppDataSource.getRepository(User);

        try {
            const video = await videoRepository.findOneByOrFail({ id: videoId });
            const user = await userRepository.findOneByOrFail({ id: userId });

            const comment = new Comment();
            comment.content = content;
            comment.video = video;
            comment.user = user;
            comment.likes = 0;

            await commentRepository.save(comment);
            
            // Return comment with user for immediate display
            res.status(201).send({
                ...comment,
                user: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar
                }
            });
        } catch (error) {
            res.status(500).send("Error creating comment");
        }
    };

    static delete = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userId = res.locals.jwtPayload.userId;
        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            const comment = await commentRepository.findOne({
                where: { id },
                relations: ["user", "video", "video.user"]
            });

            if (!comment) {
                res.status(404).send("Comment not found");
                return;
            }

            // Allow deletion if user is comment author OR video owner
            if (comment.user.id !== userId && comment.video.user.id !== userId) {
                res.status(403).send("Not authorized");
                return;
            }

            await commentRepository.remove(comment);
            res.status(204).send();
        } catch (error) {
            res.status(500).send("Error deleting comment");
        }
    };

    static like = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const commentRepository = AppDataSource.getRepository(Comment);

        try {
            const comment = await commentRepository.findOneByOrFail({ id });
            comment.likes += 1;
            await commentRepository.save(comment);
            res.send({ likes: comment.likes });
        } catch (error) {
            res.status(404).send("Comment not found");
        }
    };
}
