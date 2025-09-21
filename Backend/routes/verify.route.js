import express from "express";
import verificationController from "../controllers/verify.conntroller.js";
import mountCacheService from "../middleware/cache.middleware.js"

const router = express.Router();

router.use(express.json());
router.use(mountCacheService);

router.post('/', async (req, res) => {
  const response = await verificationController(req.body.content, req.body.context, req.body.language, req.body.embeddings);

  if (!response.error)
    res.status(200).json({ 'response': response });
  else {
    res.status(500).json({ 'error': response });
  }
});

export default router;