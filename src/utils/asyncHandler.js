const asyncHandler = (requestHandler) => {
  return async (request, response, next) => {
    try {
      await requestHandler(request, response, next);
    } catch (error) {
      return response.status(error.code || 500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

export default {
  asyncHandler,
}