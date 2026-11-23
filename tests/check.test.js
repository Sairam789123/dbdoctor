
import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(
    new URL("../src/index.js", import.meta.url)
);

test("CHECK succeeds when both databases are available", () => {
    const result = spawnSync(
        process.execPath,
        [cliPath, "check"],
        {
            encoding: "utf8"
        }
    );

    assert.strictEqual(result.status, 0);

    assert.ok(
        result.stdout.includes("PostgreSQL: connected")
    );

    assert.ok(
        result.stdout.includes("MongoDB: connected")
    );
});

test("CHECK reports PostgreSQL connection failure", () => {
    const result = spawnSync(
        process.execPath,
        [cliPath, "check"],
        {
            encoding: "utf8",
            env: {
                ...process.env,
                PGPORT: "5433"
            }
        }
    );

    assert.strictEqual(result.status, 1);

    assert.ok(
        result.stdout.includes("PostgreSQL: failed")
    );

    assert.ok(
        result.stdout.includes("MongoDB: connected")
    );
});

test("CHECK reports MongoDB connection failure", () => {
    const result = spawnSync(
        process.execPath,
        [cliPath, "check"],
        {
            encoding: "utf8",
            env: {
                ...process.env,
                MONGODB_URI: "mongodb://127.0.0.1:27018/?serverSelectionTimeoutMS=1000"
            }
        }
    );

    assert.strictEqual(result.status, 1);

    assert.ok(
        result.stdout.includes("PostgreSQL: connected")
    );

    assert.ok(
        result.stdout.includes("MongoDB: failed")
    );
});
