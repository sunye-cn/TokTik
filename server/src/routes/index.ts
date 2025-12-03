import { Router } from "express";
import auth from "./auth";
import video from "./video";
import user from "./user";

const routes = Router();

routes.use("/auth", auth);
routes.use("/videos", video);
routes.use("/users", user);

export default routes;
