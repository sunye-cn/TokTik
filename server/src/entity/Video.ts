import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Like } from "./Like";
import { Comment } from "./Comment";
import { Danmaku } from "./Danmaku";

@Entity()
export class Video {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ nullable: true })
    description!: string;

    @Column()
    url!: string;

    @Column({ nullable: true })
    thumbnailUrl!: string;

    @Column({ default: 0 })
    views!: number;

    @Column({ default: 0 })
    followerViews!: number;

    @Column({ default: 0 })
    authorViews!: number;

    @Column({ nullable: true })
    category!: string;

    @ManyToOne(() => User, (user) => user.videos, { onDelete: "CASCADE" })
    user!: User;

    @OneToMany(() => Like, (like) => like.video)
    likes!: Like[];

    @OneToMany(() => Comment, (comment) => comment.video)
    comments!: Comment[];

    @OneToMany(() => Danmaku, (danmaku) => danmaku.video)
    danmakus!: Danmaku[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
