import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Video } from "./Video";
import { Like } from "./Like";
import { Comment } from "./Comment";
import { Danmaku } from "./Danmaku";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    username!: string;

    @Column({ nullable: true })
    nickname!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    avatar!: string;

    @OneToMany(() => Video, (video) => video.user)
    videos!: Video[];

    @OneToMany(() => Like, (like) => like.user)
    likes!: Like[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments!: Comment[];

    @OneToMany(() => Danmaku, (danmaku) => danmaku.user)
    danmakus!: Danmaku[];

    @ManyToMany(() => User, (user) => user.following)
    @JoinTable()
    followers!: User[];

    @ManyToMany(() => User, (user) => user.followers)
    following!: User[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
