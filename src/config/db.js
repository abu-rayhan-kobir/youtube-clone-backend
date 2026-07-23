import mongoose from "mongoose";
import env from "./env.js";
import constants from "../constants.js";

const connectDB = async () => {
  try {
    await mongoose.connect(`${env.database_uri}/${constants.databaseName}`);
    console.log(`Server successfully connected with mongodb!`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

export default connectDB;