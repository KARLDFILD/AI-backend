const Router = require("express");
const router = new Router();
const characterController = require("../controllers/characterController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

router.post("/create", verifyAccessToken, characterController.createCharacter);
router.post("/get-one", verifyAccessToken, characterController.getOne);
router.get("/get-all", characterController.getAll);
router.put("/update/:id", verifyAccessToken, characterController.editCharacter);
router.delete(
  "/delete/:id",
  verifyAccessToken,
  characterController.deleteCharacter
);

module.exports = router;
