import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
dotenv.config({
    path:"./.env"
});

const PORT= process.env.PORT || 3000;

try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port https://localhost:${PORT}`);
    });
} catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
}



