# Graminate Server

Main Nest.js Server that powers Graminate's internal services.

## Description

Graminate Server is the central backend component for the **Graminate** ecosystem. Built with the powerful [Nest.js](https://nestjs.com/) framework (Node.js), it serves as the primary interface for database interactions, handles core business logic, and provides APIs consumed by other Graminate services.

This server ensures a consistent and reliable data layer and business logic foundation for the entire Graminate platform.

## Features

- **Centralized API:** Provides RESTful API endpoints for Graminate Consulting website (job applications), Graminate ERP, Graminate Admin.
- **Database Interaction:** Manages connections and operations with the primary database.
- **Business Logic:** Encapsulates core application logic.
- **Scalable Architecture:** Leverages Nest.js modules for maintainability and scalability.
- **TypeScript:** Built with TypeScript for strong typing and improved developer experience.

## Technology Stack

- **Framework:** [Nest.js](https://nestjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Package Manager:** [npm](https://www.npmjs.com/)
- **Database:** `[PostgreSQL]`

## Prerequisites

Before you begin, ensure you have met the following requirements:

- [Node.js](https://nodejs.org/) (LTS version recommended, e.g., >= 18.x)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A running instance of the Postgresql database.
- Git

## Installation

Follow these steps to get your development environment set up:

1.  **Clone the repository:**

```bash
git clone https://github.com/Graminate/graminate-server.git
cd graminate-server
```

2.  **Install dependencies:**

```bash
npm install
```

## Configuration

This application uses environment variables for configuration.

1.  **Create a `.env` file:**

Copy the content of the environment file to `.env`. Please contact Borneel for this.

## Running the App

Nest.js provides several ways to run the application:

```bash
# Development mode with hot-reloading
npm  run  start

# Watch mode (similar to dev)
npm  run  start:watch

# Production mode (requires build step first)
npm  run  build
npm  run  start:prod

# Debug mode
npm  run  start:debug
```
