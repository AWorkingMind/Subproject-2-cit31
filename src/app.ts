import express from 'express';

// Creates the Express application.
// This file is responsible for setting up the API itself.
export const app = express();

// Middleware that allows the API to read JSON request bodies.
// Example:
// {
//   "rating": 8
// }
app.use(express.json());

// Routes will be connected here later.
//
// Example:
// app.use('/users', usersRouter);
// app.use('/titles', titlesRouter);

// The global error handler will eventually be placed here.
// It should be added AFTER the routes so it can catch their errors.