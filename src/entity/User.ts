import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    UpdateDateColumn,
    CreateDateColumn,
    ManyToOne,
} from "typeorm";
import { RefreshToken } from "./RefreshToken";
import { Tenant } from "./Tenant";

@Entity({ name: "users" })
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

    @ManyToOne(() => Tenant)
    tenant!: Tenant;

    @UpdateDateColumn()
    updatedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
