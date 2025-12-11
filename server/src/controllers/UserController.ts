import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Video } from "../entity/Video";
import * as fs from "fs";
import * as path from "path";

export class UserController {

    static getProfile = async (req: Request, res: Response) => {
        const id = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({
                where: { id },
                select: ["id", "username", "nickname", "avatar", "createdAt"],
                relations: [
                    "videos", 
                    "videos.user", 
                    "videos.likes", 
                    "videos.likes.user", 
                    "likes", 
                    "likes.video", 
                    "likes.video.user",
                    "likes.video.likes",
                    "likes.video.likes.user",
                    "followers",
                    "following"
                ]
            });
            
            // Transform likes to return the videos
            const likedVideos = user.likes.map(like => like.video);
            const followersCount = user.followers.length;
            const followingCount = user.following.length;
            const totalLikes = user.videos.reduce((acc, video) => acc + video.likes.length, 0);
            
            res.send({ ...user, likedVideos, followersCount, followingCount, totalLikes });
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static updateProfile = async (req: Request, res: Response) => {
        const id = res.locals.jwtPayload.userId;
        const { nickname } = req.body;
        const userRepository = AppDataSource.getRepository(User);
        
        try {
            const user = await userRepository.findOneOrFail({ where: { id } });
            
            if (nickname) user.nickname = nickname;
            if (req.file) {
                // Delete old avatar if exists and not default
                if (user.avatar && fs.existsSync(user.avatar)) {
                    // fs.unlinkSync(user.avatar); // Optional: keep old avatars or delete
                }
                user.avatar = req.file.path.replace(/\\/g, "/");
            }

            await userRepository.save(user);
            res.send({ nickname: user.nickname, avatar: user.avatar });
        } catch (error) {
            res.status(500).send("Error updating profile");
        }
    };

    static getStats = async (req: Request, res: Response) => {
        const id = res.locals.jwtPayload.userId;
        const videoRepository = AppDataSource.getRepository(Video);
        
        try {
            const videos = await videoRepository.find({
                where: { user: { id } },
                relations: ["comments", "danmakus", "likes"]
            });

            const stats = videos.map(v => ({
                id: v.id,
                title: v.title,
                createdAt: v.createdAt,
                views: v.views,
                likes: v.likes.length,
                comments: v.comments.length,
                danmakus: v.danmakus.length
            }));

            res.send(stats);
        } catch (error) {
            res.status(500).send("Error fetching stats");
        }
    };

    static getOneById = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const currentUserId = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({ 
                where: { id },
                select: ["id", "username", "nickname", "avatar", "createdAt"],
                relations: ["videos", "videos.likes", "videos.likes.user", "followers", "following"]
            });

            const followersCount = user.followers.length;
            const followingCount = user.following.length;
            const totalLikes = user.videos.reduce((acc, video) => acc + video.likes.length, 0);
            
            const isFollowing = user.followers.some(u => u.id === currentUserId);

            res.send({ ...user, followersCount, followingCount, totalLikes, isFollowing });
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static getOneByUsername = async (req: Request, res: Response) => {
        const username = req.params.username;
        const currentUserId = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({ 
                where: { username },
                select: ["id", "username", "nickname", "avatar", "createdAt"],
                relations: ["videos", "videos.likes", "videos.likes.user", "followers", "following"]
            });

            const followersCount = user.followers.length;
            const followingCount = user.following.length;
            const totalLikes = user.videos.reduce((acc, video) => acc + video.likes.length, 0);
            
            const isFollowing = user.followers.some(u => u.id === currentUserId);

            res.send({ ...user, followersCount, followingCount, totalLikes, isFollowing });
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static follow = async (req: Request, res: Response) => {
        const userId = res.locals.jwtPayload.userId;
        const followId = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);

        if (userId === followId) {
            res.status(400).send("Cannot follow yourself");
            return;
        }

        try {
            const user = await userRepository.findOneOrFail({ where: { id: userId }, relations: ["following"] });
            const followUser = await userRepository.findOneOrFail({ where: { id: followId } });

            if (!user.following.some(u => u.id === followId)) {
                user.following.push(followUser);
                await userRepository.save(user);
            }
            res.send("Followed successfully");
        } catch (error) {
            res.status(500).send("Error following user");
        }
    };

    static unfollow = async (req: Request, res: Response) => {
        const userId = res.locals.jwtPayload.userId;
        const unfollowId = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);

        try {
            const user = await userRepository.findOneOrFail({ where: { id: userId }, relations: ["following"] });
            user.following = user.following.filter(u => u.id !== unfollowId);
            await userRepository.save(user);
            res.send("Unfollowed successfully");
        } catch (error) {
            res.status(500).send("Error unfollowing user");
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

    static deleteUser = async (req: Request, res: Response) => {
        const id = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({ where: { id } });
            await userRepository.remove(user);
            res.status(204).send();
        } catch (error) {
            res.status(500).send("Error deleting user");
        }
    };

    static getFollowing = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const currentUserId = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);

        try {
            const user = await userRepository.findOneOrFail({
                where: { id },
                relations: ["following", "following.following"]
            });

            const followingList = user.following.map(u => {
                // Check if u follows me (currentUserId)
                // u.following contains people u follows.
                const isFollowingMe = u.following.some(f => f.id === currentUserId);
                
                return {
                    id: u.id,
                    username: u.username,
                    nickname: u.nickname,
                    avatar: u.avatar,
                    isMutual: isFollowingMe
                };
            });

            res.send(followingList);
        } catch (error) {
            res.status(500).send("Error fetching following list");
        }
    };

    static getFollowers = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const currentUserId = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);

        try {
            const user = await userRepository.findOneOrFail({
                where: { id },
                relations: ["followers", "followers.followers"]
            });

            const followersList = user.followers.map(u => {
                // Check if I (currentUserId) follow u.
                // u.followers contains people who follow u.
                const doIFollow = u.followers.some(f => f.id === currentUserId);

                return {
                    id: u.id,
                    username: u.username,
                    nickname: u.nickname,
                    avatar: u.avatar,
                    isMutual: doIFollow,
                    isFollowing: doIFollow
                };
            });

            res.send(followersList);
        } catch (error) {
            res.status(500).send("Error fetching followers list");
        }
    };

    static removeFollower = async (req: Request, res: Response) => {
        const userId = res.locals.jwtPayload.userId;
        const followerId = parseInt(req.params.followerId);
        const userRepository = AppDataSource.getRepository(User);

        try {
            const user = await userRepository.findOneOrFail({ 
                where: { id: userId }, 
                relations: ["followers"] 
            });
            
            user.followers = user.followers.filter(u => u.id !== followerId);
            await userRepository.save(user);
            
            res.send("Follower removed successfully");
        } catch (error) {
            res.status(500).send("Error removing follower");
        }
    };
}
