import { Router, type IRouter } from "express";
import healthRouter from "./health";
import moviesRouter from "./movies";
import authRouter from "./auth";
import libraryRouter from "./library";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(moviesRouter);
router.use(libraryRouter);

export default router;
