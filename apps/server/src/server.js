import { AppDataSource } from "./data-source.js";

import app from "./app.js";

const PORT =
  Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await AppDataSource.initialize();

    console.log(
      "Database connection established."
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server:"
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();