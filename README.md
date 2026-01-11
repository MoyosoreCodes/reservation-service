# Tallie

Tallie is a restaurant reservation system API.

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/)
-   [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
-   [npm](https://www.npmjs.com/get-npm) (comes with Node.js)

## Setup Instructions

1.  **Clone the repository** (if you haven't already):

    ```bash
    git clone https://github.com/your-username/tallie.git
    cd tallie
    ```

2.  **Create a `.env` file**:
    Copy the `.env.example` (if it exists, otherwise create one) and populate it with your environment variables. A basic `.env` file has been created for you with default values:

    ```
    DB_HOST=db
    DB_PORT=5432
    DB_USER=user
    DB_PASSWORD=password
    DB_NAME=tallie_db
    REDIS_HOST=redis
    REDIS_PORT=6379
    PORT=3000
    NODE_ENV=development
    ```

3.  **Install Dependencies (Host Machine)**:
    If you plan to run tests or development scripts directly on your host machine, install the dependencies:

    ```bash
    npm install
    ```

4.  **Build and Run with Docker Compose**:
    From the project root, run the following command to build the Docker images and start the services:

    ```bash
    docker compose up --build -d
    ```

    This will start the PostgreSQL database, Redis, and the Tallie API server.

5.  **Access the Application**:
    The API server will be running on `http://localhost:3000` (or the port you specified in your `.env` file).
    The Swagger UI will be available at `http://localhost:3000/docs`.

## Database Migrations

The application is configured to run migrations automatically on startup within the Docker container. If you need to run migrations manually or generate new ones, you can use the following commands:

-   **Generate a new migration (Docker)**:
    ```bash
    docker compose exec server npm run migration:generate -- db/migrations/<MigrationName>
    ```
-   **Run pending migrations (Docker)**:
    ```bash
    docker compose exec server npm run migration:run
    ```
    (Note: This is already handled on container startup for the `production` target in `Dockerfile`.)
-   **Revert the last migration (Docker)**:
    ```bash
    docker compose exec server npm run migration:revert
    ```
-   **Generate a new migration (Host)**:
    ```bash
    npm run migration:generate -- db/migrations/<MigrationName>
    ```
-   **Run pending migrations (Host)**:
    ```bash
    npm run migration:run
    ```
-   **Revert the last migration (Host)**:
    ```bash
    npm run migration:revert
    ```

## Running Tests

To run the tests within the Docker environment:

```bash
docker compose exec server npm test
```

To run tests with coverage within the Docker environment:

```bash
docker compose exec server npm test:cov
```

To run tests directly on your host machine:

```bash
npm test
```

To run tests with coverage directly on your host machine:

```bash
npm test:cov
```