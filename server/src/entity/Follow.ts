import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Follow {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.following)
    @JoinColumn({ name: "followerId" })
    follower!: User;

    @ManyToOne(() => User, (user) => user.followers)
    @JoinColumn({ name: "followingId" })
    following!: User;

    @CreateDateColumn()
    createdAt!: Date;
}
