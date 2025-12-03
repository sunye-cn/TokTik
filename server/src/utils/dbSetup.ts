import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

export const ensureDatabaseExists = async () => {
    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: "postgres", // Connect to default database
    });

    try {
        await client.connect();
        const dbName = process.env.DB_NAME || "toktik";
        
        const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
        
        if (res.rowCount === 0) {
            console.log(`Database ${dbName} does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully.`);
        } else {
            console.log(`Database ${dbName} already exists.`);
        }
    } catch (error) {
        console.error("Error checking/creating database:", error);
        throw error;
    } finally {
        await client.end();
    }
};
