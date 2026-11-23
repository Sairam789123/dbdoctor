import { MongoClient } from "mongodb";
import { diagnoseError } from "../utils/diagnoseError.js";

export async function checkMongoDB() {
    const url = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";

    const client = new MongoClient(url);

    try {
        await client.connect();

        const database = client.db("admin");

        await database.command({ ping: 1 });

        console.log("MongoDB: Connected successfully");

        return {
            database: "MongoDB",
            status: "connected"
        };

    } catch (error) {
    const diagnosis = diagnoseError(error, "MongoDB");

    console.log("MongoDB: Connection failed");
    console.log("Problem:", diagnosis.title);
    console.log("Suggestion:", diagnosis.suggestion);

    return {
        database: "MongoDB",
        status: "failed",
        error: error.message,
        diagnosis: diagnosis
    };
}   finally {
        await client.close().catch(() => {});
    }
}
