import verificationController from "../controllers/verify.conntroller.js";
import mountCacheService from "../middleware/cache.middleware.js"
import express from "express";

const router = express.Router();
router.use(mountCacheService);

router.post('/', async (req, res) => {

  const response = await verificationController.verify_tweet(req.body.content, req.body.context, req.body.language, req.body.embeddings, req.body.date);

  if (!response.error){
    console.log("Verification Response:", response);
    res.status(200).json({ 'response': response });
  }
  else {
    console.error("Verification Error:", response.error);
    res.status(500).json({ 'error': response });
  }
});

export default router;
