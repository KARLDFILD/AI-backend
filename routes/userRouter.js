const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

router.post("/registration", userController.registration);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/get-user", verifyAccessToken, userController.getUser);

module.exports = router;
