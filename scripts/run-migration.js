import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv[2] || "run";

const commands = {
    run: "migration:run",
    revert: "migration:revert",
    generate: "migration:generate",
};

const command = commands[args];

if (!command) {
    console.error(
        `Unknown migration command: "${args}". Use: run, revert, or generate`
    );
    process.exit(1);
}

const typeormCli = path.join(
    projectRoot,
    "node_modules",
    "typeorm",
    "cli.js"
);
const dataSource = path.join(projectRoot, "src", "config", "data-source.ts");

const cmd = `npx cross-env NODE_ENV=migration tsx "${typeormCli}" ${command} -d "${dataSource}"`;

console.log(`Running: ${cmd}`);
console.log(`Using env: .env.migration`);
console.log(`Data source: ${dataSource}\n`);

try {
    execSync(cmd, {
        cwd: projectRoot,
        stdio: "inherit",
        env: {
            ...process.env,
            NODE_ENV: "migration",
        },
    });
    console.log("\nMigration completed successfully.");
} catch (error) {
    console.error("\nMigration failed.");
    process.exit(1);
}




                                                                                                                                
//   Usage:                                                                                                                         
                                                                                                                                 
//   # Run migrations against Supabase                                                                                              
//   npm run migration:supabase                                                                                                     
                                                                                                                                 
//   # Revert last migration                                                                                                        
//   npm run migration:supabase:revert                                                                                              
                                                                                                                                 
//   # Or directly                                                                                                                  
//   node scripts/run-migration.js run                                                                                              
//   node scripts/run-migration.js revert                                                                                           
//   node scripts/run-migration.js generate       
