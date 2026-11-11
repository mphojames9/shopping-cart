import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";

const createToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"7d"})
}

//login user
const loginUser = async (req,res) => {
    const {email,password} = req.body;
    try{
        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success:false,message:"User doesn't exist"})
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch) {
            return res.json({success:false,message:"Invalid credentials"})
        }

        const token = createToken(user._id);
        res.json({success:true,token})

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//register user
const registerUser = async (req,res) => {
    const {name,email,password} = req.body;
    try {
        // checking is user already exist
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success:false,message:"User already exist"})
        }

        // validating email format & strong password
        if(!validator.isEmail(email)) {
            return res.json({success:false,message:"Please enter a valid email"})
        }

        if (password.length<8) {
            return res.json({success:false,message:"Please enter a strong password (8+ characters)"})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new userModel({
            name:name,
            email:email,
            password:hashedPassword
        })

        const user = await newUser.save()
        const token = createToken(user._id)
        res.json({success:true,token});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// ---------- admin ----------
const safeEqual = (a,b) => {
    const A = Buffer.from(String(a ?? ""));
    const B = Buffer.from(String(b ?? ""));
    return A.length === B.length && crypto.timingSafeEqual(A,B);
}

const cleanEmail = (email) => String(email ?? "").trim().toLowerCase();

// adminId is used (not id) so an admin token is never mistaken for a customer token
const createAdminToken = (adminId) => {
    const payload = adminId ? {role:"admin",adminId} : {role:"admin"};
    return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"12h"});
}

// admin login: the ADMIN_EMAIL / ADMIN_PASSWORD from .env still works,
// and so do admin accounts created through adminRegister
const adminLogin = async (req,res) => {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password ?? "");
    try {
        const envEmail = cleanEmail(process.env.ADMIN_EMAIL);
        if (envEmail && process.env.ADMIN_PASSWORD
            && safeEqual(email,envEmail) && safeEqual(password,process.env.ADMIN_PASSWORD)) {
            return res.json({success:true,token:createAdminToken()})
        }

        const admin = await adminModel.findOne({email});
        if (admin && await bcrypt.compare(password,admin.password)) {
            return res.json({success:true,token:createAdminToken(admin._id)})
        }

        res.status(401).json({success:false,message:"Invalid admin credentials"})
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"Error"})
    }
}

// admin register: only people who know ADMIN_INVITE_CODE (set in .env) can create an admin account
const adminRegister = async (req,res) => {
    const name = String(req.body.name ?? "").trim();
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password ?? "");
    const {inviteCode} = req.body;
    try {
        if (!process.env.ADMIN_INVITE_CODE) {
            return res.status(403).json({success:false,message:"Admin registration is turned off. Set ADMIN_INVITE_CODE on the server to enable it"})
        }
        if (!safeEqual(inviteCode,process.env.ADMIN_INVITE_CODE)) {
            return res.status(403).json({success:false,message:"Invalid invite code"})
        }
        if (!name) {
            return res.status(400).json({success:false,message:"Please enter your name"})
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({success:false,message:"Please enter a valid email"})
        }
        if (password.length<8) {
            return res.status(400).json({success:false,message:"Password must be at least 8 characters"})
        }

        const takenByEnvAdmin = email === cleanEmail(process.env.ADMIN_EMAIL);
        if (takenByEnvAdmin || await adminModel.findOne({email})) {
            return res.status(409).json({success:false,message:"An admin with this email already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const admin = await new adminModel({name,email,password:hashedPassword}).save();
        res.json({success:true,token:createAdminToken(admin._id)})
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({success:false,message:"An admin with this email already exists"})
        }
        console.log(error);
        res.status(500).json({success:false,message:"Error"})
    }
}

export {loginUser,registerUser,adminLogin,adminRegister}
