import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import { Config } from ".";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: Config.DB_HOST ?? "",
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME ?? "",
    password: Config.DB_PASSWORD ?? "",
    database: Config.DB_NAME ?? "",

    // Do not use synchronize: true in production - may lose data , Always false
    synchronize: false,
    logging: false,
    entities: [User, RefreshToken],
    migrations: [],
    subscribers: [],
});
