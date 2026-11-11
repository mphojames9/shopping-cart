import jwt from "jsonwebtoken";

const readToken = (req) => {
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) return header.slice(7);
    return null;
}

const verify = (req) => {
    const token = readToken(req);
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

// Logged-in customer
export const authMiddleware = (req, res, next) => {
    const decoded = verify(req);
    if (!decoded || !decoded.id) {
        return res.status(401).json({ success: false, message: "Not authorised, please log in again" });
    }
    req.userId = decoded.id;
    next();
}

// Admin only (token issued by /api/user/admin-login)
export const adminMiddleware = (req, res, next) => {
    const decoded = verify(req);
    if (!decoded || decoded.role !== "admin") {
        return res.status(401).json({ success: false, message: "Admin access only" });
    }
    next();
}
