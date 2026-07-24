import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (request, response) => {
  return response.status(201).json({
    message: "ok",
  });
});

const loginUser = asyncHandler(async (request, response) => {
  return response.status(200).json({
    message: "ok",
  });
});

export {
  registerUser,
  loginUser,
}