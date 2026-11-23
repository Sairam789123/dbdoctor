
import { Client } from "pg";
import { writeFile } from "node:fs/promises";

import { auditMongoDB } from "../detectors/mongodbAudit.js";

export async function auditDatabase(options = {}) {
    const format = options.format || "terminal";
    const showOutput = format === "terminal";

    if (!["terminal", "json"].includes(format)) {
        console.log("Invalid format. Use terminal or json.");
        process.exitCode = 1;
        return;
    }

    if (showOutput) {
        console.log("\n========== DBDoctor AUDIT ==========");
        console.log("Starting database security audit...\n");
    }

    const client = new Client({
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER,
        database: process.env.PGDATABASE || "postgres"
    });

    const postgresFindings = [];

    try {
        await client.connect();

        if (showOutput) {
            console.log("PostgreSQL: Connected successfully\n");
        }

        // 1. Check superuser privileges
        const userResult = await client.query(`
            SELECT rolsuper
            FROM pg_roles
            WHERE rolname = current_user
        `);

        if (userResult.rows[0]?.rolsuper) {
            postgresFindings.push({
                check: "Superuser Privileges",
                status: "WARNING",
                message: "Connected user has superuser privileges.",
                recommendation: "Use a restricted database user for your application."
            });
        } else {
            postgresFindings.push({
                check: "Superuser Privileges",
                status: "PASS",
                message: "Connected user does not have superuser privileges.",
                recommendation: "No action required."
            });
        }

        // 2. Check trust authentication rules
        const authResult = await client.query(`
            SELECT COUNT(*) AS trust_count
            FROM pg_hba_file_rules
            WHERE auth_method = 'trust'
        `);

        if (Number(authResult.rows[0].trust_count) > 0) {
            postgresFindings.push({
                check: "Trust Authentication",
                status: "WARNING",
                message: "PostgreSQL has trust authentication rules.",
                recommendation: "Review pg_hba.conf and use password-based authentication where appropriate."
            });
        } else {
            postgresFindings.push({
                check: "Trust Authentication",
                status: "PASS",
                message: "No trust authentication rules were found.",
                recommendation: "No action required."
            });
        }

        // 3. Check connection usage
        const connectionResult = await client.query(`
            SELECT
                COUNT(*) AS active_connections,
                current_setting('max_connections')::INTEGER AS max_connections
            FROM pg_stat_activity
        `);

        const activeConnections = Number(
            connectionResult.rows[0].active_connections
        );

        const maxConnections = Number(
            connectionResult.rows[0].max_connections
        );

        const connectionUsage =
            (activeConnections / maxConnections) * 100;

        if (connectionUsage >= 80) {
            postgresFindings.push({
                check: "Connection Usage",
                status: "WARNING",
                message: `PostgreSQL connection usage is high (${connectionUsage.toFixed(2)}%).`,
                recommendation: "Review active connections and consider increasing the connection limit if necessary."
            });
        } else {
            postgresFindings.push({
                check: "Connection Usage",
                status: "PASS",
                message: `PostgreSQL connection usage is within a reasonable range (${connectionUsage.toFixed(2)}%).`,
                recommendation: "No action required."
            });
        }

        // 4. Check tables without primary keys
        const primaryKeyResult = await client.query(`
            SELECT
                schemaname,
                tablename
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            AND NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid =
                    (quote_ident(pg_tables.schemaname) || '.' ||
                     quote_ident(pg_tables.tablename))::regclass
                AND contype = 'p'
            )
        `);

        if (primaryKeyResult.rows.length > 0) {
            const tables = primaryKeyResult.rows.map(
                row => `${row.schemaname}.${row.tablename}`
            );

            postgresFindings.push({
                check: "Primary Keys",
                status: "WARNING",
                message: `Found ${tables.length} table(s) without primary keys: ${tables.join(", ")}`,
                recommendation: "Review these tables and add primary keys where appropriate."
            });
        } else {
            postgresFindings.push({
                check: "Primary Keys",
                status: "PASS",
                message: "All application tables have primary keys.",
                recommendation: "No action required."
            });
        }

    } catch (error) {
        if (showOutput) {
            console.log("PostgreSQL audit failed:", error.message);
        }

        postgresFindings.push({
            check: "PostgreSQL Audit",
            status: "ERROR",
            message: error.message,
            recommendation: "Check the PostgreSQL connection and database user permissions."
        });

    } finally {
        await client.end().catch(() => {});
    }

    // Display PostgreSQL findings
    if (showOutput) {
        console.log("\n========== POSTGRESQL RESULTS ==========\n");

        for (const finding of postgresFindings) {
            console.log(`[${finding.status}] ${finding.check}`);
            console.log(finding.message);
            console.log("Recommendation:", finding.recommendation);
            console.log("");
        }
    }

    // Run MongoDB audit
    const mongoFindings = await auditMongoDB(showOutput);

    // Combine PostgreSQL and MongoDB findings
    const allFindings = [
        ...postgresFindings,
        ...mongoFindings
    ];

    // Calculate summary
    let passedCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (const finding of allFindings) {
        if (finding.status === "PASS") {
            passedCount++;
        } else if (finding.status === "WARNING") {
            warningCount++;
        } else if (finding.status === "ERROR") {
            errorCount++;
        }
    }

    const summary = {
        total: allFindings.length,
        passed: passedCount,
        warnings: warningCount,
        errors: errorCount
    };

    // Display overall summary
    if (showOutput) {
        console.log("\n========== DBDOCTOR OVERALL SUMMARY ==========\n");

        console.log("PostgreSQL checks:", postgresFindings.length);
        console.log("MongoDB checks:", mongoFindings.length);

        console.log("-----------------------------------------------");

        console.log("Total checks:", summary.total);
        console.log("Passed:", summary.passed);
        console.log("Warnings:", summary.warnings);
        console.log("Errors:", summary.errors);

        console.log("\n===============================================\n");
    }

    // Generate JSON report if requested
    if (format === "json") {
        const report = {
            tool: "DBDoctor",
            generatedAt: new Date().toISOString(),
            summary,
            findings: allFindings
        };

        try {
            await writeFile(
                "dbdoctor-report.json",
                JSON.stringify(report, null, 2),
                "utf8"
            );

            console.log("JSON report saved to dbdoctor-report.json");

        } catch (error) {
            console.error("Could not save JSON report:", error.message);
            process.exitCode = 1;
        }
    }

    if (errorCount > 0) {
        process.exitCode = 1;
    }

    return allFindings;
}
