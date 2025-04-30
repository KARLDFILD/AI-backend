const Router = require("express");
const router = new Router();
const messageController = require("../controllers/messageController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

router.post("/send", verifyAccessToken, messageController.sendMessage);
router.post("/get-messages", verifyAccessToken, messageController.getMessages);

module.exports = router;
