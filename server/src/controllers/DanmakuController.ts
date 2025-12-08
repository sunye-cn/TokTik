import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Danmaku } from "../entity/Danmaku";
import { Video } from "../entity/Video";
import { User } from "../entity/User";

export class DanmakuController {
    static list = async (req: Request, res: Response) => {
        const videoId = parseInt(req.params.videoId);
        const danmakuRepository = AppDataSource.getRepository(Danmaku);
        
        try {
            const danmakus = await danmakuRepository.find({
                where: { video: { id: videoId } },
                relations: ["user"],
                order: { time: "ASC" }
            });
            res.send(danmakus);
        } catch (error) {
            res.status(500).send("Error fetching danmakus");
        }
    };

    static create = async (req: Request, res: Response) => {
        const videoId = parseInt(req.params.videoId);
        const { content, time, color, position, fontSize } = req.body;
        const userId = res.locals.jwtPayload.userId;

        if (!content || time === undefined) {
            res.status(400).send("Content and time are required");
            return;
        }

        const danmakuRepository = AppDataSource.getRepository(Danmaku);
        const videoRepository = AppDataSource.getRepository(Video);
        const userRepository = AppDataSource.getRepository(User);

        try {
            const video = await videoRepository.findOneByOrFail({ id: videoId });
            const user = await userRepository.findOneByOrFail({ id: userId });

            const danmaku = new Danmaku();
            danmaku.content = content;
            danmaku.time = time;
            danmaku.color = color || "#ffffff";
            danmaku.position = position || "scroll";
            danmaku.fontSize = fontSize || 16;
            danmaku.video = video;
            danmaku.user = user;

            await danmakuRepository.save(danmaku);
            
            res.status(201).send({
                ...danmaku,
                user: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname
                }
            });
        } catch (error) {
            res.status(500).send("Error creating danmaku");
        }
    };
}
