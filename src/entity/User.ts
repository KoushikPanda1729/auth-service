import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    UpdateDateColumn,
    CreateDateColumn,
} from "typeorm";
import { RefreshToken } from "./RefreshToken";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    firstName!: string;

    @Column({ type: "varchar" })
    lastName!: string;

    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ type: "varchar" })
    password!: string;

    @Column({ type: "varchar" })
    role!: string;

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshTokens!: RefreshToken[];

    @UpdateDateColumn()
    updatedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
