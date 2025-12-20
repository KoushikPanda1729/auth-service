import { type MigrationInterface, type QueryRunner } from "typeorm";

export class CreateTenant1766229417577 implements MigrationInterface {
    name = "CreateTenant1766229417577";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`
        );
        await queryRunner.query(
            `CREATE TABLE "tenants" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "address" character varying(200) NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE SEQUENCE IF NOT EXISTS "refreshTokens_id_seq" OWNED BY "refreshTokens"."id"`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ALTER COLUMN "id" SET DEFAULT nextval('"refreshTokens_id_seq"')`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ALTER COLUMN "id" DROP DEFAULT`
        );
        await queryRunner.query(
            `CREATE SEQUENCE IF NOT EXISTS "users_id_seq" OWNED BY "users"."id"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('"users_id_seq"')`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_265bec4e500714d5269580a0219"`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq')`
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`
        );
        await queryRunner.query(`DROP SEQUENCE "users_id_seq"`);
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ALTER COLUMN "id" SET DEFAULT nextval('refresh_token_id_seq')`
        );
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ALTER COLUMN "id" DROP DEFAULT`
        );
        await queryRunner.query(`DROP SEQUENCE "refreshTokens_id_seq"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
