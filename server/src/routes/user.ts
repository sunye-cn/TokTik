import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { checkJwt } from "../middlewares/checkJwt";

const router = Router();

router.get("/:id([0-9]+)", [checkJwt], UserController.getOneById);
router.get("/:id([0-9]+)/videos", [checkJwt], UserController.getVideosByUser);

export default router;
