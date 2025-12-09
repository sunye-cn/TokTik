import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Video } from "./Video";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    content!: string;

    @ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
    user!: User;

    @ManyToOne(() => Video, (video) => video.comments, { onDelete: "CASCADE" })
    video!: Video;

    @Column({ default: 0 })
    likes!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
