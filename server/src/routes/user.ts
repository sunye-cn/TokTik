import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { checkJwt } from "../middlewares/checkJwt";
import multer from "multer";
import path from "path";

const router = Router();

// Multer config for avatar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

router.get("/profile", [checkJwt], UserController.getProfile);
router.get("/u/:username", [checkJwt], UserController.getOneByUsername);
router.patch("/profile", [checkJwt, upload.single('avatar')], UserController.updateProfile);
router.get("/stats", [checkJwt], UserController.getStats);
router.get("/:id([0-9]+)", [checkJwt], UserController.getOneById);
router.post("/:id([0-9]+)/follow", [checkJwt], UserController.follow);
router.delete("/:id([0-9]+)/follow", [checkJwt], UserController.unfollow);
router.get("/:id([0-9]+)/videos", [checkJwt], UserController.getVideosByUser);
router.get("/:id([0-9]+)/following", [checkJwt], UserController.getFollowing);
router.get("/:id([0-9]+)/followers", [checkJwt], UserController.getFollowers);
router.delete("/:id([0-9]+)/followers/:followerId([0-9]+)", [checkJwt], UserController.removeFollower);
router.delete("/profile", [checkJwt], UserController.deleteUser);

export default router;
