
import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import {
    mkdtempSync,
    readFileSync,
    rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(
    new URL("../src/index.js", import.meta.url)
);

test("AUDIT displays the terminal report", () => {
    const result = spawnSync(
        process.execPath,
        [cliPath, "audit"],
        {
            encoding: "utf8",
            timeout: 15000
        }
    );

    assert.strictEqual(result.status, 0);

    assert.ok(
        result.stdout.includes("DBDOCTOR OVERALL SUMMARY")
    );

    assert.ok(
        result.stdout.includes("Total checks:")
    );
});

test("AUDIT generates a valid JSON report", () => {
    const testDirectory = mkdtempSync(
        join(tmpdir(), "dbdoctor-audit-test-")
    );

    try {
        const result = spawnSync(
            process.execPath,
            [cliPath, "audit", "--format", "json"],
            {
                cwd: testDirectory,
                encoding: "utf8",
                timeout: 15000
            }
        );

        assert.strictEqual(result.status, 0);

        assert.ok(
            result.stdout.includes("JSON report saved")
        );

        const report = JSON.parse(
            readFileSync(
                join(testDirectory, "dbdoctor-report.json"),
                "utf8"
            )
        );

        assert.strictEqual(report.tool, "DBDoctor");

        assert.ok(report.generatedAt);

        assert.ok(report.summary.total > 0);

        assert.ok(Array.isArray(report.findings));

        assert.strictEqual(
            report.summary.total,
            report.findings.length
        );
    } finally {
        rmSync(testDirectory, {
            recursive: true,
            force: true
        });
    }
});
