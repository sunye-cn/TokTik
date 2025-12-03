import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { AppDataSource } from "./data-source";
import routes from "./routes";
import * as path from "path";
import * as fs from "fs";
import { ensureDatabaseExists } from "./utils/dbSetup";

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

ensureDatabaseExists().then(() => {
    AppDataSource.initialize().then(async () => {

        // create express app
        const app = express();

        // Call middlewares
        app.use(cors());
        app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }));
        app.use(morgan("tiny"));
        app.use(bodyParser.json());

        // Serve static files
        app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

        // Set all routes from routes folder
        app.use("/api", routes);

        // start express server
        app.listen(3000, () => {
            console.log("Server started on port 3000!");
        });

    }).catch(error => console.log(error));
}).catch(error => {
    console.log("Failed to ensure database exists:", error);
});
