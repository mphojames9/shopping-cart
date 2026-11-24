import express from "express";
import { validateCoupon,listCoupons,addCoupon,setCouponStatus,removeCoupon } from "../controllers/couponController.js";
import { authMiddleware,adminMiddleware } from "../middleware/auth.js";

const couponRouter = express.Router();

couponRouter.post("/validate",authMiddleware,validateCoupon);
couponRouter.get("/list",adminMiddleware,listCoupons);
couponRouter.post("/add",adminMiddleware,addCoupon);
couponRouter.post("/status",adminMiddleware,setCouponStatus);
couponRouter.post("/remove",adminMiddleware,removeCoupon);

export default couponRouter;
