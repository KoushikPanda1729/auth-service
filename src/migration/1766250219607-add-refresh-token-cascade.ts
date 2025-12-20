import { type MigrationInterface, type QueryRunner } from "typeorm";

export class AddRefreshTokenCascade1766250219607 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT IF EXISTS "FK_refreshTokens_userId"`
        );

        // Add the foreign key constraint back with ON DELETE CASCADE
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_refreshTokens_userId"
             FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the foreign key constraint with CASCADE
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT IF EXISTS "FK_refreshTokens_userId"`
        );

        // Add the foreign key constraint back without CASCADE (original state)
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_refreshTokens_userId"
             FOREIGN KEY ("userId") REFERENCES "users"("id")`
        );
    }
}
