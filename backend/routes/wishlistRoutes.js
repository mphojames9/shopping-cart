import express from "express";
import { getWishlist,addToWishlist,removeFromWishlist,mergeWishlist } from "../controllers/wishlistController.js";
import { authMiddleware } from "../middleware/auth.js";

const wishlistRouter = express.Router();

wishlistRouter.post("/get",authMiddleware,getWishlist);
wishlistRouter.post("/add",authMiddleware,addToWishlist);
wishlistRouter.post("/remove",authMiddleware,removeFromWishlist);
wishlistRouter.post("/merge",authMiddleware,mergeWishlist);

export default wishlistRouter;
