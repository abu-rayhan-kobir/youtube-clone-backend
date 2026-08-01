import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token!",
    );
  }
};

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
  const { email, username, password } = request.body;
  if (!(!username || !email)) {
    throw new ApiError(400, "Username or email is required!");
  }

  if (!password) {
    throw new ApiError(400, "Password is required!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not registered!");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password was incorrect!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return response
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully!",
      ),
    );
});

const logoutUser = asyncHandler(async (request, response) => {
  await User.findByIdAndUpdate(
    request.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return response
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User successfully logged out!"));
});

const refreshAccessToken = asyncHandler(async (request, response) => {
  const incomingRefreshToken =
    request.cookies.refreshToken || request.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request!");
  }

  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      env.refresh_token_secret,
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token!");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
    );

    return response
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed!",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token!");
  }
});

const changeCurrentPassword = asyncHandler(async (request, response) => {
  const { oldPassword, newPassword } = request.body;
  if (!oldPassword && !newPassword) {
    throw new ApiError(400, "Old password and new password is required!");
  }
  const user = await User.findById(request.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return response
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

const getCurrentUser = asyncHandler(async (request, response) => {
  return response
    .status(200)
    .json(
      new ApiResponse(200, request.user, "Currrent user fetched successfully!"),
    );
});

const updateAccountDetails = asyncHandler(async (request, response) => {
  const { fullName, email } = request.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required!");
  }

  const updatedUser = await User.findByIdAndUpdate(
    request.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  return response
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"));
});

const updateUserAvatar = asyncHandler(async (request, response) => {
  const avatarLocalPath = request.file?.path;
  if (!avatarLocalPath) {
    new ApiError(400, "Avatar file is missing!");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar on cloudinary!");
  }
  const updatedAvatar = await User.findByIdAndUpdate(
    request.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select("-password");
  return response.status(200).json(
    new ApiResponse(200, user, "Avatar updated successsfully!"),
  )
});

const updateUserCoverImage = asyncHandler(async (request, response) => {
  const coverImageLocalPath = request.file?.path;
  if (!coverImageLocalPath) {
    new ApiError(400, "Cover image file is missing!");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image on cloudinary!");
  }
  const updatedCoverImage = await User.findOneAndUpdate(
    request.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    },
  ).select("-password");
  return response.status(200).json(
    new ApiResponse(200, user, "Cover image updated successfully!"),
  );
});

const getUserChannelProfile = asyncHandler(async (request, response) => {
  const {username} = request.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing!");
  }
 const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $count: {
            if: {
              $in: [request.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false,
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists!");
  }
  return response.status(200).json(
    new ApiResponse(200, channel[0], "User channel fetched successfully!"),
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
