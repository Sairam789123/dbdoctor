import pg from "pg";
import { diagnoseError } from "../utils/diagnoseError.js";

const { Client } = pg;

export async function checkPostgres() {
    const client = new Client({
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER,
        database: process.env.PGDATABASE || "postgres"
    });

    try {
        await client.connect();

        const result = await client.query("SELECT NOW()");

        console.log("PostgreSQL: Connected successfully");
        console.log("Host:", process.env.PGHOST || "localhost");
        console.log("Port:", process.env.PGPORT || 5432);
        console.log("Server time:", result.rows[0].now);

        return {
            database: "PostgreSQL",
            status: "connected"
        };

    } catch (error) {
    const diagnosis = diagnoseError(error, "PostgreSQL");

    console.log("PostgreSQL: Connection failed");
    console.log("Problem:", diagnosis.title);
    console.log("Suggestion:", diagnosis.suggestion);

    return {
        database: "PostgreSQL",
        status: "failed",
        error: error.message,
        diagnosis: diagnosis
    };
}   finally {
        await client.end().catch(() => {});
    }
}
