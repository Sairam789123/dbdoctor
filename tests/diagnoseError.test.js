
import { test } from "node:test";
import assert from "node:assert";

import { diagnoseError } from "../src/utils/diagnoseError.js";

test("Detects PostgreSQL connection refused error", () => {
    const error = {
        code: "ECONNREFUSED",
        message: "Connection refused"
    };

    const result = diagnoseError(error, "PostgreSQL");

    assert.strictEqual(
        result.title,
        "PostgreSQL server is unreachable"
    );
});

test("Detects PostgreSQL authentication failure", () => {
    const error = {
        code: "28P01",
        message: "Password authentication failed"
    };

    const result = diagnoseError(error, "PostgreSQL");

    assert.strictEqual(
        result.title,
        "PostgreSQL password authentication failed"
    );
});

test("Detects missing PostgreSQL database", () => {
    const error = {
        code: "3D000",
        message: "Database does not exist"
    };

    const result = diagnoseError(error, "PostgreSQL");

    assert.strictEqual(
        result.title,
        "PostgreSQL database does not exist"
    );
});

test("Returns unknown error for unrecognized problems", () => {
    const error = {
        code: "UNKNOWN",
        message: "Something went wrong"
    };

    const result = diagnoseError(error, "MongoDB");

    assert.strictEqual(
        result.title,
        "Unknown database error"
    );
});

test("Detects database hostname resolution failure", () => {
    const error = {
        code: "ENOTFOUND",
        message: "Hostname not found"
    };

    const result = diagnoseError(error, "PostgreSQL");

    assert.strictEqual(
        result.title,
        "Database hostname could not be resolved"
    );
});

test("Detects too many PostgreSQL connections", () => {
    const error = {
        code: "53300",
        message: "Too many connections"
    };

    const result = diagnoseError(error, "PostgreSQL");

    assert.strictEqual(
        result.title,
        "Too many PostgreSQL connections"
    );
});

