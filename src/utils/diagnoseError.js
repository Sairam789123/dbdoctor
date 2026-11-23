export function diagnoseError(error, databaseType) {
    const errorCode = error.code || error.cause?.code;
    const errorMessage = error.message || "";

    if (
    errorCode === "ECONNREFUSED" ||
    errorMessage.includes("ECONNREFUSED")
) {
        return {
            title: `${databaseType} server is unreachable`,
            suggestion: "Check whether the database server is running and the host and port are correct."
        };
    }

    if (
    errorCode === "ENOTFOUND" ||
    errorMessage.includes("ENOTFOUND")
) {
        return {
            title: "Database hostname could not be resolved",
            suggestion: "Check the hostname in your database configuration."
        };
    }
    if (databaseType === "PostgreSQL" && errorCode === "28P01") {
    return {
        title: "PostgreSQL password authentication failed",
        suggestion: "Check your PostgreSQL username and password."
    };
}

if (databaseType === "PostgreSQL" && errorCode === "3D000") {
    return {
        title: "PostgreSQL database does not exist",
        suggestion: "Check the database name in your configuration."
    };
}

if (databaseType === "PostgreSQL" && errorCode === "53300") {
    return {
        title: "Too many PostgreSQL connections",
        suggestion: "Close unused connections or increase the server connection limit."
    };
}

    return {
        title: "Unknown database error",
        suggestion: "Check your database configuration and error details."
    };
}