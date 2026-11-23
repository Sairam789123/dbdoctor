#!/usr/bin/env node

import "dotenv/config";
import { Command } from "commander";

import { checkDatabase } from "./commands/check.js";
import { auditDatabase } from "./commands/audit.js";
import { fixDatabase } from "./commands/fix.js";

const program = new Command();


program
    .name("dbdoctor")
    .description("A CLI tool to diagnose, repair, and audit databases")
    .version("1.0.0");

program.command("check")
    .description("Check database connectivity")
    .action(checkDatabase);

program.command("fix")
    .description("Fix common database configuration issues")
    .option("--dry-run", "Preview fixes without modifying files")
    .action(fixDatabase);

program.command("audit")
    .description("Audit database security and health")
    .option(
        "--format <type>",
        "Choose report format (terminal or json)",
        "terminal"
    )
    .action((options) => auditDatabase(options));

program.parse();
