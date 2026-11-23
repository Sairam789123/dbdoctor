
import { checkPostgres } from "../detectors/postgres.js";
import { checkMongoDB } from "../detectors/mongodb.js";

export async function checkDatabase() {
    console.log("\n========== DBDoctor ==========");
    console.log("Starting database health check...\n");

    const postgresResult = await checkPostgres();

    console.log("");

    const mongoResult = await checkMongoDB();

    console.log("\n========== SUMMARY ==========");

    console.log(
        "PostgreSQL:",
        postgresResult.status
    );

    console.log(
        "MongoDB:",
        mongoResult.status
    );

    console.log("=============================\n");
    if (
    postgresResult.status === "failed" ||
    mongoResult.status === "failed"
) {
    process.exitCode = 1;
}
}
