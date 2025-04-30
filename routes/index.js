const Router = require("express");
const router = new Router();
const userRouter = require("./userRouter");
const characterRouter = require("./charactersRouter");
const chatRouter = require("./chatRouter");
const messageRouter = require("./messageRouter");

router.use("/user", userRouter);
router.use("/character", characterRouter);
router.use("/chat", chatRouter);
router.use("/message", messageRouter);

module.exports = router;
