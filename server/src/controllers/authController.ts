import { authService } from "../services/authService";
import { Request, Response, NextFunction } from 'express';

async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { username, email, password } = req.body;
        const newUser = await authService.registerUser(username, email, password);
        return res.status(200).json({message: 'Success'});
    } catch (err) {
        next(err);
    }
}

async function verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
        const { code } = req.params;
        await authService.verifyEmail(code);
        return res.status(200).json({message: 'Success'});
    } catch (err) {
        next(err);
    }
}

async function newVerificationCode(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user.id;
        await authService.newVerificationCode(userId);
        return res.status(200).json('Success');
    } catch (err) {
        next(err);
    }
}

async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        const { refreshToken, accessToken, user } = await authService.login(email, password);

        res.cookie('refreshToken', String(await refreshToken), {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({ accessToken, user });
    } catch (err) {
        next(err);
    }
}

async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await authService.logout(refreshToken);
        res.cookie('refreshToken', refreshToken, { maxAge: 0 });
        res.cookie('token', '', { maxAge: 0 });
        return res.status(200).json({ message: 'Success' });
    } catch (err) {
        next(err);
    }
}

async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            throw({status: 401, message: 'Not authorized'});
        }
        const { newRefreshToken, newAccessToken, user } = await authService.refreshToken(refreshToken) as { newRefreshToken: string, newAccessToken: string, user: unknown };
        res.cookie('refreshToken', await newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ accessToken: newAccessToken, user });
    } catch (err) {
        next(err);
    }
}

export const authController = {
    register,
    login,
    logout,
    verifyEmail,
    newVerificationCode,
    refreshToken
};