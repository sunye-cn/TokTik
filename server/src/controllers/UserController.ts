import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Video } from "../entity/Video";
import { Follow } from "../entity/Follow";
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
                relations: ["videos", "videos.likes", "videos.likes.user", "followers", "following", "followers.follower"]
            });

            const followersCount = user.followers.length;
            const followingCount = user.following.length;
            const totalLikes = user.videos.reduce((acc, video) => acc + video.likes.length, 0);
            
            const isFollowing = user.followers.some(f => f.follower.id === currentUserId);

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
                relations: ["videos", "videos.likes", "videos.likes.user", "followers", "following", "followers.follower"]
            });

            const followersCount = user.followers.length;
            const followingCount = user.following.length;
            const totalLikes = user.videos.reduce((acc, video) => acc + video.likes.length, 0);
            
            const isFollowing = user.followers.some(f => f.follower.id === currentUserId);

            res.send({ ...user, followersCount, followingCount, totalLikes, isFollowing });
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static follow = async (req: Request, res: Response) => {
        const userId = res.locals.jwtPayload.userId;
        const followId = parseInt(req.params.id);
        const followRepository = AppDataSource.getRepository(Follow);
        const userRepository = AppDataSource.getRepository(User);

        if (userId === followId) {
            res.status(400).send("Cannot follow yourself");
            return;
        }

        try {
            const existingFollow = await followRepository.findOne({
                where: {
                    follower: { id: userId },
                    following: { id: followId }
                }
            });

            if (!existingFollow) {
                const follow = new Follow();
                follow.follower = await userRepository.findOneOrFail({ where: { id: userId } });
                follow.following = await userRepository.findOneOrFail({ where: { id: followId } });
                await followRepository.save(follow);
            }
            res.send("Followed successfully");
        } catch (error) {
            res.status(500).send("Error following user");
        }
    };

    static unfollow = async (req: Request, res: Response) => {
        const userId = res.locals.jwtPayload.userId;
        const unfollowId = parseInt(req.params.id);
        const followRepository = AppDataSource.getRepository(Follow);

        try {
            const follow = await followRepository.findOne({
                where: {
                    follower: { id: userId },
                    following: { id: unfollowId }
                }
            });

            if (follow) {
                await followRepository.remove(follow);
            }
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
        const followRepository = AppDataSource.getRepository(Follow);

        try {
            const follows = await followRepository.find({
                where: { follower: { id } },
                relations: ["following"]
            });

            const followingUsers = follows.map(f => f.following);
            
            const myFollows = await followRepository.find({
                where: { follower: { id: currentUserId } },
                relations: ["following"]
            });
            const myFollowIds = new Set(myFollows.map(f => f.following.id));

            const myFollowers = await followRepository.find({
                where: { following: { id: currentUserId } },
                relations: ["follower"]
            });
            const myFollowerIds = new Set(myFollowers.map(f => f.follower.id));

            const result = followingUsers.map(u => {
                const isFollowing = myFollowIds.has(u.id);
                const isFollowedBy = myFollowerIds.has(u.id);
                return {
                    id: u.id,
                    username: u.username,
                    nickname: u.nickname,
                    avatar: u.avatar,
                    isMutual: isFollowing && isFollowedBy,
                    isFollowing: isFollowing
                };
            });

            res.send(result);
        } catch (error) {
            res.status(500).send("Error fetching following list");
        }
    };

    static getFollowers = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const currentUserId = res.locals.jwtPayload.userId;
        const followRepository = AppDataSource.getRepository(Follow);

        try {
            const follows = await followRepository.find({
                where: { following: { id } },
                relations: ["follower"]
            });

            const followerUsers = follows.map(f => f.follower);

            const myFollows = await followRepository.find({
                where: { follower: { id: currentUserId } },
                relations: ["following"]
            });
            const myFollowIds = new Set(myFollows.map(f => f.following.id));

            const myFollowers = await followRepository.find({
                where: { following: { id: currentUserId } },
                relations: ["follower"]
            });
            const myFollowerIds = new Set(myFollowers.map(f => f.follower.id));

            const result = followerUsers.map(u => {
                const isFollowing = myFollowIds.has(u.id);
                const isFollowedBy = myFollowerIds.has(u.id);
                return {
                    id: u.id,
                    username: u.username,
                    nickname: u.nickname,
                    avatar: u.avatar,
                    isMutual: isFollowing && isFollowedBy,
                    isFollowing: isFollowing
                };
            });

            res.send(result);
        } catch (error) {
            res.status(500).send("Error fetching followers list");
        }
    };

    static removeFollower = async (req: Request, res: Response) => {
        const userId = res.locals.jwtPayload.userId;
        const followerId = parseInt(req.params.followerId);
        const followRepository = AppDataSource.getRepository(Follow);

        try {
            const follow = await followRepository.findOne({
                where: {
                    follower: { id: followerId },
                    following: { id: userId }
                }
            });
            
            if (follow) {
                await followRepository.remove(follow);
            }
            
            res.send("Follower removed successfully");
        } catch (error) {
            res.status(500).send("Error removing follower");
        }
    };
}
