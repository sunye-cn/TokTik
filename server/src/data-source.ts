import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Video } from "./entity/Video";
import { Like } from "./entity/Like";
import { Comment } from "./entity/Comment";
import { Danmaku } from "./entity/Danmaku";
import { Follow } from "./entity/Follow";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "toktik",
    synchronize: true, // Don't use this in production
    logging: false,
    entities: [User, Video, Like, Comment, Danmaku, Follow],
    migrations: [],
    subscribers: [],
});
