
import mongoose from "mongoose";

mongoose.set("strictQuery", false);


class Database {
    url: string;
    constructor(url: string) {
        this.url = url;
    }

    async connect() {
        try {
            await mongoose.connect(this.url);
            console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);
        } catch (error) {
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log(`Disconnected from the database: ${mongoose.connection.db.databaseName}`);
        } catch (error) {
            throw error;
        }
    }
}

export default Database;