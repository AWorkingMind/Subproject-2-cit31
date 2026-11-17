import type {Request, Response, NextFunction} from "express";

export class NotFound extends Error {}
export class Conflict extends Error {}
export class ServiceUnavailable extends Error {}
export class BadRequest extends Error {}

export function errorHandler(
    err: Error & {status?: number; type?: string},
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    if (res.headersSent) {
        next(err);
        return;
    }

    let status = 500;
    let error = "Internal Server Error";
    let message = "Internal error";

    if (err instanceof NotFound) {
        status = 404;
        error = "Not Found";
        message = err.message;
    } else if (err instanceof Conflict) {
        status = 409;
        error = "Conflict";
        message = err.message;
    } else if (err instanceof ServiceUnavailable) {
        status = 503;
        error = "Service Unavailable";
        message = err.message;
    } else if (err instanceof BadRequest) {
        status = 400;
        error = "Bad Request";
        message = err.message;
    } else if (err.status === 400) {
        status = 400;
        error = "Bad Request";
        message = err.type === "entity.parse.failed"
            ? "The request body is not valid JSON"
            : "Invalid request";
    }

    if (status >= 500) {
        console.error(err);
    }

    res.status(status).json({
        status,
        error,
        message,
        timestamp: new Date().toISOString()
    });
}
