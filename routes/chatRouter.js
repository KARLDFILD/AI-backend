const Router = require("express");
const router = new Router();
const chatController = require("../controllers/chatController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

router.post("/create", verifyAccessToken, chatController.createChatSession);
router.post("/get-dialog", verifyAccessToken, chatController.getSession);
router.delete(
  "/delete/:id",
  verifyAccessToken,
  chatController.deleteChatSession
);

module.exports = router;
