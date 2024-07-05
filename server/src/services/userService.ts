import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from './../models/userModel';
import RefreshToken from './../models/refreshTokenModel';
import dotenv from 'dotenv';
import Test from './../models/testModel';
dotenv.config();

export interface UserJWTPayload extends JwtPayload {
    id: string,
    email: string
}

function generateAccessToken(email: string, id: string) {
    const accessToken = jwt.sign({ id: id, email: email }, process.env.ACCESS_SECRET as Secret, { expiresIn: '1h' });

    return accessToken;
}

async function generateRefreshToken(email: string, id: string) {
    const refreshToken = jwt.sign({ id: id, email: email }, process.env.REFRESH_SECRET as Secret, { expiresIn: '60d' });

    const token = new RefreshToken({ user: id, token: refreshToken, expiresAt: (Date.now() + 60 * 24 * 60 * 60 * 1000) });
    await token.save();

    return refreshToken;
}

async function registerUser(username: string, email: string, password: string) {
    const isEmailRegistered = await User.findOne({ email });
    const isUsernameRegistered = await User.findOne({ username });

    if (isEmailRegistered) {
        throw new Error('User with this email already exists')
    }
    if (isUsernameRegistered) {
        throw new Error('User with this username already exists')
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: passwordHash })
    await newUser.save();
    return newUser;
}

async function login(email: string, pass: string) {
    const userData = await User.findOne({ email: email });

    if (!userData) {
        throw new Error('Invalid email or password')
    }
    const { password, ...user } = userData.toObject();
    console.log(user)
    const isPasswordValid = await bcrypt.compare(pass, password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password')
    }

    const refreshToken = generateRefreshToken(email, String(userData._id));
    const accessToken = generateAccessToken(email, String(userData._id));

    return { accessToken, refreshToken, user };
}

async function logout(token: string) {
    const refToken = RefreshToken.findOne({ token });
    if (!refToken) {
        throw new Error('Invalid token');
    }
    return await RefreshToken.findOneAndDelete({ token });
}

async function refreshToken(token: string) {
    const refToken = await RefreshToken.findOne({ token });
    if (!refToken) {
        throw new Error('Invalid refresh token');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.REFRESH_SECRET as Secret, async (err, payload) => {
            if (err) {
                throw new Error('Invalid refresh token');
            }
            const userPayload = payload as UserJWTPayload;
            const userData = await User.findById(userPayload.id);
            if (!userData) {
                throw new Error('user not found');
            }
            const newRefreshToken = generateRefreshToken(userPayload.email, userPayload.id);
            const newAccessToken = generateAccessToken(userPayload.email, userPayload.id);


            const { password, ...user } = userData.toObject();
            resolve({ newRefreshToken, newAccessToken, user });
            return await RefreshToken.findOneAndDelete({ token });
        })
    })
}

async function getUser(token: string) {

    if (!token) {
        throw new Error('Not authorized');
    }

    const decodedJWT = JSON.parse(atob(token.split('.')[1]));
    const userData = await User.findById(decodedJWT.id);
    if (!userData) {
        throw new Error('User not found');
    }

    const { password, ...user } = userData.toObject();
    return user;
}

async function likeTest(userId: string, testId: string) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const test = await Test.findById(testId);
    if (!test) {
        throw new Error('Test not found');
    }
    if ((user.likedPosts as unknown[]).includes(testId)) {
        await Test.findByIdAndUpdate(testId, { $set: { likes: --test.likes } });
        await User.findByIdAndUpdate(userId, { $pull: { likedPosts: test._id } });
    } else {
        await Test.findByIdAndUpdate(testId, { $set: { likes: ++test.likes } });
        await User.findByIdAndUpdate(userId, { $set: { likedPosts: [...user.likedPosts, test._id] } });
    }
}

export const userService = {
    registerUser,
    login,
    logout,
    refreshToken,
    getUser,
    likeTest
};