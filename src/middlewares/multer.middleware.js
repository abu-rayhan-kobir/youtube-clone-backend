import multer from "multer";

const storage = multer.diskStorage({
  destination: function (request, file, callbacke) {
    callbacke(null, "./public/temp");
  },
  filename: function (request, file, callbacke) {
    const fileName = `${Date.now()}-${file.originalname}`;
    callbacke(null, fileName);
  }
});

const upload = multer({storage});

export default upload;