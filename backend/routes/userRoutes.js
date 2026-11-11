import express from "express";
import { loginUser,registerUser,adminLogin,adminRegister } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);
userRouter.post("/admin-login",adminLogin);
userRouter.post("/admin-register",adminRegister);

export default userRouter;
