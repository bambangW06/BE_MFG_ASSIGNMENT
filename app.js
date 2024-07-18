require("dotenv").config();
var express = require("express");
var cors = require("cors");
var multer = require("multer");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var app = express();
var indexRouter = require("./routes/index");
// const sqlinjection = require("sql-injection");
const { rateLimit } = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 3 * 1000, // 15 minutes
  limit: 20, // Limit each IP to 100 requests per window (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: RateLimit-* headers; draft-7: combined RateLimit header
  legacyHeaders: false, // Disable the X-RateLimit-* headers.
  validate: {
    xForwardedForHeader: false,
    default: true,
  },
});

// Deklarasi path untuk penyimpanan file
const uploadPath = path.join(__dirname, "uploads");

// Konfigurasi multer untuk menangani unggahan file
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(upload.single("foto")); // 'foto sesuai dengan nama field pada form
app.use(limiter);
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Mengatur akses statis ke folder 'uploads'
app.use("/uploads", express.static(uploadPath));

app.use(express.static(path.join(__dirname, "public")));
// app.use(sqlinjection);
app.use("/", require("./routes"));
app.use("/", indexRouter);

module.exports = app;
