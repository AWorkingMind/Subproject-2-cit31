# Person 3 Test Results

## Implementation

Person 3 implements user registration and login, bcrypt password hashing, JWT authentication, user ownership checks, a shared PostgreSQL pool, central error handling, and CORS for the configured frontend origin.

## Test methods

Vitest is used for unit tests in `sandra.test.ts`. Supertest sends HTTP requests to the Express app without starting the server by hand. `sandra.database.test.ts` uses one PostgreSQL client, starts a transaction, and always rolls it back.

## Actual results

`npm run build` passed.

`npm test` passed 12 tests. The tests cover password hashing, password verification, JWT creation and validation, user DTO mapping, invalid registration, 400, 401, 403, 404 and duplicate-user 409 error responses, and CORS.

Final validation on 2026-11-17 gave 12 passed and 1 skipped.

One database test was skipped because no real `DB_PASSWORD` is configured. When the existing RUC connection is configured, it also checks the original `create_user` duplicate-user error on one pool client. It rolls back the test user and checks that it is gone.

## Requirements

The tests show that passwords are not returned in the user DTO, invalid and missing authentication is rejected, one user cannot access another user account, errors use the required four fields, and only the configured frontend origin receives CORS access.

## Limitations

No `.env` file or real database password was available in this run, so the RUC database connection was not attempted and no data was changed. IMDB reads, paged lists, bookmarks, ratings, and search history are Person 1 or Person 2 endpoints and are not present in this project folder.

A successful HTTP registration was not run because it would commit a user outside the rollback-only database test.
