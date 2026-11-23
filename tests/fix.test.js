
import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import {
    mkdtempSync,
    writeFileSync,
    readFileSync,
    rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Find DBDoctor's CLI entry point
const cliPath = fileURLToPath(
    new URL("../src/index.js", import.meta.url)
);

test("FIX dry-run does not modify .gitignore", () => {
    const testDirectory = mkdtempSync(
        join(tmpdir(), "dbdoctor-test-")
    );

    try {
        writeFileSync(
            join(testDirectory, ".env"),
            "TEST=value\n"
        );

        writeFileSync(
            join(testDirectory, ".gitignore"),
            "node_modules/\n"
        );

        const result = spawnSync(
            process.execPath,
            [cliPath, "fix", "--dry-run"],
            {
                cwd: testDirectory,
                encoding: "utf8"
            }
        );

        const updatedGitignore = readFileSync(
            join(testDirectory, ".gitignore"),
            "utf8"
        );

        assert.strictEqual(result.status, 0);

        assert.ok(
            result.stdout.includes("[DRY RUN]")
        );

        assert.strictEqual(
            updatedGitignore,
            "node_modules/\n"
        );
    } finally {
        rmSync(testDirectory, {
            recursive: true,
            force: true
        });
    }
});

test("FIX does not modify files without interactive confirmation", () => {
    const testDirectory = mkdtempSync(
        join(tmpdir(), "dbdoctor-test-")
    );

    try {
        writeFileSync(
            join(testDirectory, ".env"),
            "TEST=value\n"
        );

        writeFileSync(
            join(testDirectory, ".gitignore"),
            "node_modules/\n"
        );

        const result = spawnSync(
            process.execPath,
            [cliPath, "fix"],
            {
                cwd: testDirectory,
                encoding: "utf8",
                input: "y\n"
            }
        );

        const updatedGitignore = readFileSync(
            join(testDirectory, ".gitignore"),
            "utf8"
        );

        assert.strictEqual(result.status, 0);

        assert.ok(
            result.stdout.includes("Cannot request confirmation")
        );

        assert.strictEqual(
            updatedGitignore,
            "node_modules/\n"
        );
    } finally {
        rmSync(testDirectory, {
            recursive: true,
            force: true
        });
    }
});
