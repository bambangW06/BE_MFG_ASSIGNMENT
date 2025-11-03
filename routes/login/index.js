const {
  login,
  checkSession,
  logout,
  register,
} = require("../../controllers/login/login.controller");

const router = require("express").Router();

router.post("/login", login);
router.get("/check-session", checkSession);
router.post("/logout", logout);
router.post("/register", register);

module.exports = router;
