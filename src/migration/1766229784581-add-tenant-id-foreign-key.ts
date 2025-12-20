import { type MigrationInterface, type QueryRunner } from "typeorm";

export class AddTenantIdForeignKey1766229784581 implements MigrationInterface {
    name = "AddTenantIdForeignKey1766229784581";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "tenantId" integer`);
        await queryRunner.query(
            `CREATE SEQUENCE IF NOT EXISTS "refreshTokens_id_seq" OWNED BY "refreshTokens"."id"`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ALTER COLUMN "id" SET DEFAULT nextval('"refreshTokens_id_seq"')`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_265bec4e500714d5269580a0219"`
        );
        await queryRunner.query(
            `CREATE SEQUENCE IF NOT EXISTS "users_id_seq" OWNED BY "users"."id"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('"users_id_seq"')`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_265bec4e500714d5269580a0219"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`
        );
        await queryRunner.query(`DROP SEQUENCE "users_id_seq"`);
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ALTER COLUMN "id" DROP DEFAULT`
        );
        await queryRunner.query(`DROP SEQUENCE "refreshTokens_id_seq"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tenantId"`);
    }
}
