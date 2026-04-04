import { ConnectionPool } from "mssql";
import type { config as MSSQLConfig } from "mssql";

const requireEnv = (name: "DB_USER" | "DB_PASSWORD" | "DB_SERVER" | "DB_NAME"): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const config: MSSQLConfig = {
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    server: requireEnv("DB_SERVER"),
    database: requireEnv("DB_NAME"),
    options: {
        encrypt: true,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
};

export const pool = new ConnectionPool(config);
export const connectDB = async () => {
    if (!pool.connected) await pool.connect();
    return pool;
};