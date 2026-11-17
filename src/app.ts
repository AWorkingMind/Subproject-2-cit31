import express from 'express';
import { searchRouter } from "./routes/search.js";
import { peopleRouter } from "./routes/people.js";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { historyRouter } from "./routes/history.js";

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

app.use("/search", searchRouter);
app.use("/people", peopleRouter);
app.use("/bookmarks", bookmarksRouter);
app.use("/history", historyRouter);
// Example:
// app.use('/users', usersRouter);
// app.use('/titles', titlesRouter);

// The global error handler will eventually be placed here.
// It should be added AFTER the routes so it can catch their errors.