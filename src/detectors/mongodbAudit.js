
import { MongoClient } from "mongodb";

export async function auditMongoDB(showOutput = true) {
    if (showOutput) {
        console.log("\n========== MongoDB AUDIT ==========");
        console.log("Starting MongoDB security audit...\n");
    }

    const url = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
    const client = new MongoClient(url);

    const findings = [];

    try {
        await client.connect();

        if (showOutput) {
            console.log("MongoDB: Connected successfully\n");
        }

        // 1. Check authentication configuration
        const database = client.db("admin");

        const result = await database.command({
            getCmdLineOpts: 1
        });

        const security = result.parsed?.security;
        const authentication = security?.authorization;

        if (authentication === "enabled") {
            findings.push({
                check: "Authentication",
                status: "PASS",
                message: "MongoDB authentication is enabled.",
                recommendation: "No action required."
            });
        } else {
            findings.push({
                check: "Authentication",
                status: "WARNING",
                message: "MongoDB authentication does not appear to be enabled.",
                recommendation: "Enable MongoDB authentication and configure database users."
            });
        }

        // 2. Check network binding
        const network = result.parsed?.net;
        const bindIp = network?.bindIp || "127.0.0.1";

        if (
            bindIp === "0.0.0.0" ||
            (typeof bindIp === "string" && bindIp.includes("0.0.0.0")) ||
            (Array.isArray(bindIp) && bindIp.includes("0.0.0.0"))
        ) {
            findings.push({
                check: "Network Exposure",
                status: "WARNING",
                message: "MongoDB is listening on all IPv4 network interfaces.",
                recommendation: "Restrict MongoDB to trusted network interfaces."
            });
        } else {
            findings.push({
                check: "Network Exposure",
                status: "PASS",
                message: `MongoDB bind IP is ${Array.isArray(bindIp) ? bindIp.join(", ") : bindIp}.`,
                recommendation: "Verify that only trusted machines can access the database."
            });
        }

        // 3. Check collection indexes
        const applicationDatabase = client.db();

        const collections = await applicationDatabase
            .listCollections({}, { nameOnly: true })
            .toArray();

        const collectionsWithoutIndexes = [];

        for (const collection of collections) {
            const indexes = await applicationDatabase
                .collection(collection.name)
                .listIndexes()
                .toArray();

            const hasSecondaryIndex = indexes.some(
                index => index.name !== "_id_"
            );

            if (!hasSecondaryIndex) {
                collectionsWithoutIndexes.push(collection.name);
            }
        }

        if (collections.length === 0) {
            findings.push({
                check: "Collection Indexes",
                status: "PASS",
                message: "No collections were found in the selected database.",
                recommendation: "Create collections and review their indexing needs when required."
            });
        } else if (collectionsWithoutIndexes.length > 0) {
            findings.push({
                check: "Collection Indexes",
                status: "WARNING",
                message: `Collections without secondary indexes: ${collectionsWithoutIndexes.join(", ")}`,
                recommendation: "Review query patterns and add indexes where they improve performance."
            });
        } else {
            findings.push({
                check: "Collection Indexes",
                status: "PASS",
                message: "All collections have at least one secondary index.",
                recommendation: "Review index usage periodically."
            });
        }

    } catch (error) {
        if (showOutput) {
            console.log("MongoDB audit failed:", error.message);
        }

        findings.push({
            check: "MongoDB Audit",
            status: "ERROR",
            message: error.message,
            recommendation: "Check the MongoDB connection and the permissions of the database user."
        });

    } finally {
        await client.close().catch(() => {});
    }

    // Display findings only when terminal output is enabled
    if (showOutput) {
        console.log("========== AUDIT RESULTS ==========\n");

        let passedCount = 0;
        let warningCount = 0;

        for (const finding of findings) {
            console.log(`[${finding.status}] ${finding.check}`);
            console.log(finding.message);
            console.log("Recommendation:", finding.recommendation);
            console.log("");

            if (finding.status === "PASS") {
                passedCount++;
            } else if (finding.status === "WARNING") {
                warningCount++;
            }
        }

        console.log("========== AUDIT SUMMARY ==========");
        console.log("Total checks:", findings.length);
        console.log("Passed:", passedCount);
        console.log("Warnings:", warningCount);
        console.log("===================================\n");
    }

    return findings;
}
