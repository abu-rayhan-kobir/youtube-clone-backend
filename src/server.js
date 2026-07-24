import env from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = env.port || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server successfully started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
  }
};

await startServer();