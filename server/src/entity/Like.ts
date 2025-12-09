import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Video } from "./Video";

@Entity()
export class Like {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.likes, { onDelete: "CASCADE" })
    user!: User;

    @ManyToOne(() => Video, (video) => video.likes, { onDelete: "CASCADE" })
    video!: Video;

    @CreateDateColumn()
    createdAt!: Date;
}
