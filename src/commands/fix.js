
import { access, readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

async function askConfirmation(message) {
    // Avoid making changes when running without an interactive terminal
    if (!process.stdin.isTTY) {
        console.log("Cannot request confirmation in a non-interactive terminal.");
        return false;
    }

    const terminal = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const answer = await terminal.question(`${message} (y/N): `);

        return answer.trim().toLowerCase() === "y";
    } finally {
        terminal.close();
    }
}

export async function fixDatabase(options = {}) {
    const dryRun = options.dryRun || false;

    console.log("\n========== DBDoctor FIX ==========\n");

    if (dryRun) {
        console.log("DRY RUN MODE: No files will be modified.\n");
    }

    // 1. Check whether .env exists
    let envExists = true;

    try {
        await access(".env");
        console.log("[PASS] .env file exists.");
    } catch {
        envExists = false;
        console.log("[WARNING] .env file was not found.");
        console.log("Recommendation: Create a .env file using .env.example as a reference.");
    }

    // 2. Check whether .gitignore exists
    let gitignoreContent = "";

    try {
        gitignoreContent = await readFile(".gitignore", "utf8");
        console.log("\n[PASS] .gitignore file exists.");
    } catch (error) {
        if (error.code === "ENOENT") {
            console.log("\n[WARNING] .gitignore file was not found.");
        } else {
            console.log("\n[ERROR] Could not read .gitignore:", error.message);
            process.exitCode = 1;
            return;
        }
    }

    // 3. Check whether .env is protected by .gitignore
    const ignoreLines = gitignoreContent
        .split(/\r?\n/)
        .map(line => line.trim());

    let envIsIgnored = ignoreLines.some(
        line => line === ".env" || line === ".env/"
    );

    if (envIsIgnored) {
        console.log("[PASS] .env is protected by .gitignore.");
    } else {
        console.log("[WARNING] .env is not protected by .gitignore.");

        if (dryRun) {
            console.log("[DRY RUN] DBDoctor would add .env to .gitignore.");
        } else {
            const confirmed = await askConfirmation(
                "DBDoctor wants to add .env to .gitignore. Continue?"
            );

            if (confirmed) {
                const updatedContent =
                    gitignoreContent +
                    (gitignoreContent && !gitignoreContent.endsWith("\n") ? "\n" : "") +
                    ".env\n";

                try {
                    await writeFile(".gitignore", updatedContent, "utf8");
                    console.log("[FIXED] Added .env to .gitignore.");

                    envIsIgnored = true;
                } catch (error) {
                    console.log("[ERROR] Could not update .gitignore:", error.message);
                    process.exitCode = 1;
                }
            } else {
                console.log("[SKIPPED] No changes were made to .gitignore.");
            }
        }
    }

    // 4. Final summary
    console.log("\n========== FIX SUMMARY ==========\n");

    console.log("Environment file:", envExists ? "Found" : "Missing");

    console.log(
        ".env protection:",
        envIsIgnored ? "Protected" :
        dryRun ? "Needs fixing (dry run)" : "Not protected"
    );

    if (!envExists) {
        console.log("\nCreate a .env file using .env.example as a reference.");
    }

    console.log("\n=================================\n");
}
