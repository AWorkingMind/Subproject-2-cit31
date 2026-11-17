import express from "express";
import { errorHandler, NotFound } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import titlesRouter from "./routes/titles.js";
import peopleRouter from "./routes/people.js";
import ratingsRouter from "./routes/ratings.js";

const app = express();

app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/titles", titlesRouter);
app.use("/api/people", peopleRouter);
app.use("/api/users", ratingsRouter);
app.use((_req, _res, next) => {
    next(new NotFound("No such endpoint"));
});
app.use(errorHandler);

export default app;
