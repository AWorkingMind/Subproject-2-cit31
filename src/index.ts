import { app } from './app.js';

// The port our backend server will run on.
const PORT = 3000;

// Starts the Express server.
//
// app.ts builds the API.
// index.ts actually starts it.
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});