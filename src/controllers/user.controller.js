import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (request, response) => {
  const { username, fullName, email, password } = request.body;
  
  if (
    [username, fullName, email, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required!");
  }
  const existedUser = await User.findOne({
    $or: [
      {
        username,
      },
      {
        email,
      },
    ],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist!");
  }

  const avatarLocalPath = request.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImageLocalPath;
  if (
    request.files &&
    Array.isArray(request.files.coverImage) &&
    request.files.coverImage.length > 0
  ) {
    coverImageLocalPath = request.files.coverImage[0].path;
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user!");
  }
  return response
    .status(201)
    .json(new ApiResponse(200, createdUser, "User successfully registered!"));
});

const loginUser = asyncHandler(async (request, response) => {
  return response.status(200).json({
    message: "ok",
  });
});

export { registerUser, loginUser };
