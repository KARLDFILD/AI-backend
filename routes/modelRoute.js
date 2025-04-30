const Router = require("express");
const router = new Router();
const modelController = require("../controllers/modelController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

router.post("/model", verifyAccessToken, modelController.generateMessage);

module.exports = router;
