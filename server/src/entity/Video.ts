import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Like } from "./Like";

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

    @ManyToOne(() => User, (user) => user.videos)
    user!: User;

    @OneToMany(() => Like, (like) => like.video)
    likes!: Like[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
