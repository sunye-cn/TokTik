import { Router } from "express";
import { VideoController } from "../controllers/VideoController";
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
router.delete("/:id([0-9]+)", [checkJwt], VideoController.delete);
router.post("/:id([0-9]+)/like", [checkJwt], VideoController.like);
router.delete("/:id([0-9]+)/like", [checkJwt], VideoController.unlike);

export default router;
