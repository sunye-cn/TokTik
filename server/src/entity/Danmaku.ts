import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Video } from "./Video";

@Entity()
export class Danmaku {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    content!: string;

    @Column("float")
    time!: number;

    @Column({ default: "#ffffff" })
    color!: string;

    @Column({ default: "scroll" }) // scroll, top, bottom
    position!: string;

    @Column({ default: 16 })
    fontSize!: number;

    @ManyToOne(() => User, (user) => user.danmakus, { onDelete: "CASCADE" })
    user!: User;

    @ManyToOne(() => Video, (video) => video.danmakus, { onDelete: "CASCADE" })
    video!: Video;

    @CreateDateColumn()
    createdAt!: Date;
}
