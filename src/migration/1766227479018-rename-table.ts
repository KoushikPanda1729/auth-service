import { type MigrationInterface, type QueryRunner } from "typeorm";

export class RenameTable1766227479018 implements MigrationInterface {
    name = "RenameTable1766227479018";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "users"`);
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME TO "refreshTokens"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" RENAME TO "refresh_token"`
        );
        await queryRunner.query(`ALTER TABLE "users" RENAME TO "user"`);
    }
}
