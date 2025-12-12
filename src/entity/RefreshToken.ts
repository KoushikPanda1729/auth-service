import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    UpdateDateColumn,
    CreateDateColumn,
} from "typeorm";
import type { User } from "./User";

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "timestamp" })
    expiresAt!: Date;

    @ManyToOne("User", (user: User) => user.refreshTokens)
    user!: User;

    @UpdateDateColumn()
    updatedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
