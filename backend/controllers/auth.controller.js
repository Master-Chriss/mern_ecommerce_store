import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import { redis } from '../lib/redis.js';
// import {refreshToken} from '../routes/auth.route.js'

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET , {
        expiresIn: '15m'
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });

    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60); // expires in 7 days
};

const setCookies = (res, accessToken, refreshToken) => {
    // const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
        httpOnly: true, //prevents Cross-site Scripting attack (XSS)
        secure: false,
        sameSite: "Lax", // prevents Cross-site request forgery attack (CSRF).... Lax for local test
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, //prevents Cross-site Scripting attack (XSS)
        secure: false,
        sameSite: "Lax", // prevents Cross-site request forgery attack (CSRF)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

export const signup = async (req, res) => {
    const {name, email, password} = req.body;
    try {
        const userExists = await User.findOne({ email });
        
        if(userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password });

        // Authenticate the user
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                message: "User created successfully :("
            });

    } catch (error) {
        console.log("Error in signup controller");
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
    const user = await User.findOne({email});



    if(user && (await user.comparePassword(password))) {
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: "Login successful :("
        })
    } else {
        res.status(500).json({message: "Invalid email or password!"});
    }

    } catch (error) {
        res.status(500).json({ message: error.message, stack: error.stack });
    }
    
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({message: "Logged out Successfully!"});
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};

// This is for refreshing the access token
export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            return res.status(401).json({message: "No refresh token provided."});
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

        if(storedToken !== refreshToken) {
            return res.status(401).json({message: "Invalid refresh token"});
        }

        const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '15m' 
        });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });
        
        res.json({message: "Token refreshed successfully!"});
    } catch (error) {
        
    }
}

export const getProfile = async (req, res) => {
    try {
        if(!req.user) {
            res.status(401).json({message: "User not found."});
        }
        
        res.json(req.user);
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Server error", error: error.message});
    }
};