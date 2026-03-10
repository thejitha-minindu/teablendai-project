import { ConnectionPool } from "mssql";

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

export const pool = new ConnectionPool(config);
export const connectDB = async () => {
    if (!pool.connected) await pool.connect();
    return pool;
};