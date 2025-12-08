import { Router } from "express";
import { VideoController } from "../controllers/VideoController";
import { CommentController } from "../controllers/CommentController";
import { DanmakuController } from "../controllers/DanmakuController";
import { checkJwt } from "../middlewares/checkJwt";
import multer from "multer";
import path from "path";

const router = Router();

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
    }
});

const upload = multer({ storage: storage });

router.get("/", VideoController.listAll);
router.get("/:id([0-9]+)", VideoController.getOneById);
router.post("/", [checkJwt, upload.single('video')], VideoController.upload);
router.patch("/:id([0-9]+)", [checkJwt], VideoController.update);
router.delete("/:id([0-9]+)", [checkJwt], VideoController.delete);
router.post("/:id([0-9]+)/like", [checkJwt], VideoController.like);
router.delete("/:id([0-9]+)/like", [checkJwt], VideoController.unlike);

// Comments
router.get("/:videoId([0-9]+)/comments", CommentController.list);
router.post("/:videoId([0-9]+)/comments", [checkJwt], CommentController.create);
router.delete("/comments/:id([0-9]+)", [checkJwt], CommentController.delete);
router.post("/comments/:id([0-9]+)/like", [checkJwt], CommentController.like);

// Danmaku
router.get("/:videoId([0-9]+)/danmaku", DanmakuController.list);
router.post("/:videoId([0-9]+)/danmaku", [checkJwt], DanmakuController.create);

export default router;
