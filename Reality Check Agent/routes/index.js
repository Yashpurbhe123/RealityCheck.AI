import verificationRoute from "./verify.route.js"
import chatRoute from "./chat.route.js"
import express from "express";

const router = express.Router();

router.use(express.json());
router.use("/verify", verificationRoute);
router.use("/chat", chatRoute);

export default router;

