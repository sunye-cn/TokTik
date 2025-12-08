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
router.patch("/profile", [checkJwt, upload.single('avatar')], UserController.updateProfile);
router.get("/stats", [checkJwt], UserController.getStats);
router.get("/:id([0-9]+)", [checkJwt], UserController.getOneById);
router.get("/:id([0-9]+)/videos", [checkJwt], UserController.getVideosByUser);

export default router;
