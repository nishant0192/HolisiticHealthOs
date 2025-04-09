// src/services/user.service.ts
import { UserModel } from '../models/user.model';
import { ApiError } from '../middlewares/error.middleware';
import { transformUserResponse } from '../utils/transform';

export class UserService {
    private userModel: UserModel;

    constructor() {
        this.userModel = new UserModel();
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new ApiError('User not found', 404);
            }
            return transformUserResponse(user);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Error in getUserById:', error);
            throw new ApiError('Failed to get user information', 500);
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        try {
            const user = await this.userModel.findByEmail(email);
            if (!user) {
                throw new ApiError('User not found', 404);
            }
            return transformUserResponse(user);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Error in getUserByEmail:', error);
            throw new ApiError('Failed to get user information', 500);
        }
    }

    /**
     * Update user information
     */
    async updateUser(userId: string, userData: any) {
        try {
            const userExists = await this.userModel.findById(userId);
            if (!userExists) {
                throw new ApiError('User not found', 404);
            }

            // Only allow certain fields to be updated
            const allowedFields = [
                'first_name',
                'last_name',
                'date_of_birth',
                'gender',
                'phone_number',
                'profile_picture'
            ];
            const updateData: any = {};
            for (const field of allowedFields) {
                if (userData[field] !== undefined) {
                    updateData[field] = userData[field];
                }
            }

            const updatedUser = await this.userModel.update(userId, updateData);
            return transformUserResponse(updatedUser);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('Error in updateUser:', error);
            throw new ApiError('Failed to update user information', 500);
        }
    }

    /**
     * Get all users with pagination
     */
    async getAllUsers(page: number, limit: number) {
        try {
            // Calculate offset and fetch records. This assumes your model has a method like findAndCountAll.
            const offset = (page - 1) * limit;
            const { users, total } = await this.userModel.findAndCountAll({ offset, limit });

            // Transform user objects (if needed)
            const transformedUsers = users.map((user: any) => transformUserResponse(user));
            return { users: transformedUsers, total };
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw new ApiError('Failed to get users', 500);
        }
    }

    /**
     * Update user status (e.g., active/inactive)
     */
    async updateUserStatus(userId: string, isActive: boolean) {
        try {
            const userExists = await this.userModel.findById(userId);
            if (!userExists) {
                throw new ApiError('User not found', 404);
            }

            // Update user status. This assumes that your model has an updateStatus method.
            const updatedUser = await this.userModel.updateStatus(userId, isActive);
            return transformUserResponse(updatedUser);
        } catch (error) {
            console.error('Error in updateUserStatus:', error);
            throw new ApiError('Failed to update user status', 500);
        }
    }
}
