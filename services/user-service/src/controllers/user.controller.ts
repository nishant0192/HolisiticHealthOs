// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * Get user information
     */
    getUserInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user.id;
            const user = await this.userService.getUserById(userId);

            res.status(200).json({
                status: 'success',
                data: user
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update user information
     */
    updateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user.id;
            const userData = req.body;

            const updatedUser = await this.userService.updateUser(userId, userData);

            res.status(200).json({
                status: 'success',
                message: 'User information updated successfully',
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get user by ID (admin only)
     */
    getUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id;
            const user = await this.userService.getUserById(userId);

            res.status(200).json({
                status: 'success',
                data: user
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all users (admin only)
     */
    getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const { users, total } = await this.userService.getAllUsers(page, limit);

            res.status(200).json({
                status: 'success',
                data: {
                    users,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update user status (admin only)
     */
    updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.params.id;
            const { is_active } = req.body;

            const updatedUser = await this.userService.updateUserStatus(userId, is_active);

            res.status(200).json({
                status: 'success',
                message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    };
}