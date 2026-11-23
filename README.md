# DBDoctor 🩺

**A CLI tool to diagnose, repair, and audit PostgreSQL and MongoDB databases.**

DBDoctor helps developers identify common database connection problems, safely repair configuration issues, and inspect database security and health.

## Features

### 1. Database Health Check
- Check PostgreSQL connectivity.
- Check MongoDB connectivity.
- Detect common connection errors.
- Provide suggestions to resolve connection problems.
- Return appropriate exit codes for failed checks.

### 2. Safe Configuration Repair
- Check whether the `.env` file exists.
- Check whether `.gitignore` exists.
- Detect whether `.env` is protected by `.gitignore`.
- Ask for confirmation before modifying files.
- Support dry-run mode to preview changes without modifying files.

### 3. Database Security Audit
- Detect PostgreSQL superuser connections.
- Check PostgreSQL trust authentication rules.
- Inspect PostgreSQL connection usage.
- Identify PostgreSQL tables without primary keys.
- Check MongoDB authentication configuration.
- Inspect MongoDB network binding.
- Check collection indexes.

### 4. Report Generation
- Display audit results in the terminal.
- Generate a JSON audit report.
- Include findings, recommendations, and summary counts.

## Technologies Used

- Node.js
- JavaScript (ES Modules)
- PostgreSQL
- MongoDB
- Commander.js
- pg
- MongoDB Node.js Driver
- dotenv
- Node.js Built-in Test Runner

## Requirements

- Node.js 22.12.0 or newer
- npm
- PostgreSQL server (for PostgreSQL checks)
- MongoDB server (for MongoDB checks)


## Installation

### Install from npm

Install DBDoctor globally:

```bash
npm install -g @sairam789152615/dbdoctor
```

Verify the installation:

```bash
dbdoctor --version
```

### Install from source (Development)

Clone the repository:

```bash
git clone https://github.com/Sairam789123/dbdoctor.git
```

Navigate into the project:

```bash
cd dbdoctor
```

Install dependencies:

```bash
npm install
```

Link the CLI globally for local development:

```bash
npm link
```


## Configuration

Create a `.env` file in your project directory.

Example configuration:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGDATABASE=postgres

MONGODB_URI=mongodb://127.0.0.1:27017
```

Replace `your_username` with your PostgreSQL username.

Make sure your `.env` file is not committed to Git.

## Usage

### Check database connectivity

```bash
dbdoctor check
```

Checks PostgreSQL and MongoDB connections and displays diagnostic suggestions if a connection fails.

### Repair configuration issues

```bash
dbdoctor fix
```

Checks `.env` and `.gitignore` and asks for confirmation before adding `.env` to `.gitignore`.

Preview changes without modifying files:

```bash
dbdoctor fix --dry-run
```

### Audit database security and health

```bash
dbdoctor audit
```

Displays database security and health findings in the terminal.

Generate a JSON report:

```bash
dbdoctor audit --format json
```

The JSON report is saved as:

```text
dbdoctor-report.json
```

## Running Tests

DBDoctor uses Node.js's built-in test runner.

Run:

```bash
npm test
```

The tests cover:
- Database error diagnosis.
- PostgreSQL connectivity.
- MongoDB connectivity.
- Safe configuration repair.
- Audit output and JSON report generation.

## Project Structure

```text
dbdoctor/
│
├── src/
│   ├── commands/
│   │   ├── check.js
│   │   ├── fix.js
│   │   └── audit.js
│   │
│   ├── detectors/
│   │   ├── postgres.js
│   │   ├── mongodb.js
│   │   └── mongodbAudit.js
│   │
│   ├── utils/
│   │   └── diagnoseError.js
│   │
│   └── index.js
│
├── tests/
│   ├── audit.test.js
│   ├── check.test.js
│   ├── diagnoseError.test.js
│   └── fix.test.js
│
├── .env.example
├── .gitignore
├── .npmignore
├── LICENSE
├── package.json
├── package-lock.json
└── README.md
```

## Safety

DBDoctor follows a cautious approach to configuration repairs:

- It asks for confirmation before modifying `.gitignore`.
- Dry-run mode does not modify files.
- It does not automatically change database credentials.
- Audit findings are recommendations; they do not automatically modify database security settings.

## License

ISC License.

## Current Limitations

- Database checks require the respective database servers to be running.
- Security audit results depend on the permissions of the connected database user.
- Configuration repair currently focuses on `.env` protection through `.gitignore`.
- Audit findings provide recommendations and do not automatically change database settings.
