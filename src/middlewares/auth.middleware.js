import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (request, _, next) => {
  try {
    const token =
      request.cookise?.accessToken ||
      request.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized request!");
    }
    const decodedToken = await jwt.verify(token, env.access_token_secret);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token!");
    }

    request.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token!");
  }
});

export default verifyJWT;
