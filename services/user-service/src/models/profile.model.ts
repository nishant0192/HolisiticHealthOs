import { pool } from '../config/database.config';
import { logger } from '../middlewares/logging.middleware';

export interface Profile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: Date;
    gender?: string;
    phone_number?: string;
    profile_picture?: string;
    preferred_units?: {
        weight: string;
        height: string;
        distance: string;
    };
    notification_preferences?: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    created_at: Date;
    updated_at: Date;
}

export interface UpdateProfileParams {
    first_name?: string;
    last_name?: string;
    date_of_birth?: Date;
    gender?: string;
    phone_number?: string;
    profile_picture?: string;
    preferred_units?: {
        weight: string;
        height: string;
        distance: string;
    };
    notification_preferences?: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
}

export class ProfileModel {
    async findByUserId(userId: string): Promise<Profile | null> {
        try {
            // Get basic profile info from users table
            const userQuery = `
        SELECT id, first_name, last_name, date_of_birth, gender, 
               phone_number, profile_picture
        FROM users
        WHERE id = $1
      `;

            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return null;
            }

            // Get additional profile info from user_profiles table
            const profileQuery = `
        SELECT preferred_units, notification_preferences, created_at, updated_at
        FROM user_profiles
        WHERE user_id = $1
      `;

            const profileResult = await pool.query(profileQuery, [userId]);

            // Combine the results
            const user = userResult.rows[0];
            const profile = profileResult.rows[0] || {};

            return {
                id: profile.id || null,
                user_id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                phone_number: user.phone_number,
                profile_picture: user.profile_picture,
                preferred_units: profile.preferred_units || { weight: 'kg', height: 'cm', distance: 'km' },
                notification_preferences: profile.notification_preferences || { email: true, push: true, sms: false },
                created_at: profile.created_at || user.created_at,
                updated_at: profile.updated_at || user.updated_at
            };
        } catch (error) {
            logger.error('Error in ProfileModel.findByUserId:', error);
            throw error;
        }
    }

    async update(userId: string, data: UpdateProfileParams): Promise<Profile> {
        try {
            // Start a transaction
            await pool.query('BEGIN');

            try {
                // Update the users table
                const userUpdateFields = [
                    'first_name', 'last_name', 'date_of_birth',
                    'gender', 'phone_number', 'profile_picture'
                ];

                let userUpdateQuery = 'UPDATE users SET ';
                const userUpdateValues = [];
                let paramIndex = 1;

                userUpdateFields.forEach(field => {
                    if (data[field as keyof UpdateProfileParams] !== undefined) {
                        if (paramIndex > 1) userUpdateQuery += ', ';
                        userUpdateQuery += `${field} = $${paramIndex}`;
                        userUpdateValues.push(data[field as keyof UpdateProfileParams]);
                        paramIndex++;
                    }
                });

                if (userUpdateValues.length > 0) {
                    userUpdateQuery += ', updated_at = NOW() WHERE id = $' + paramIndex;
                    userUpdateValues.push(userId);

                    await pool.query(userUpdateQuery, userUpdateValues);
                }

                // Update or insert into user_profiles table
                const profileFields = ['preferred_units', 'notification_preferences'];
                let hasProfileUpdate = false;

                for (const field of profileFields) {
                    if (data[field as keyof UpdateProfileParams] !== undefined) {
                        hasProfileUpdate = true;
                        break;
                    }
                }

                if (hasProfileUpdate) {
                    // Check if profile already exists
                    const checkQuery = 'SELECT id FROM user_profiles WHERE user_id = $1';
                    const checkResult = await pool.query(checkQuery, [userId]);

                    if (checkResult.rows.length > 0) {
                        // Update existing profile
                        let profileUpdateQuery = 'UPDATE user_profiles SET ';
                        const profileUpdateValues = [];
                        paramIndex = 1;

                        profileFields.forEach(field => {
                            if (data[field as keyof UpdateProfileParams] !== undefined) {
                                if (paramIndex > 1) profileUpdateQuery += ', ';
                                profileUpdateQuery += `${field} = $${paramIndex}`;
                                profileUpdateValues.push(data[field as keyof UpdateProfileParams]);
                                paramIndex++;
                            }
                        });

                        profileUpdateQuery += ', updated_at = NOW() WHERE user_id = $' + paramIndex;
                        profileUpdateValues.push(userId);

                        await pool.query(profileUpdateQuery, profileUpdateValues);
                    } else {
                        // Insert new profile
                        const columns = ['user_id'];
                        const placeholders = ['$1'];
                        const values = [userId];
                        paramIndex = 2;

                        profileFields.forEach(field => {
                            if (data[field as keyof UpdateProfileParams] !== undefined) {
                                columns.push(field);
                                placeholders.push(`$${paramIndex}`);
                                const value = data[field as keyof UpdateProfileParams];
                                if (value !== undefined) {
                                    values.push(typeof value === 'object' ? JSON.stringify(value) : value);
                                }
                                paramIndex++;
                            }
                        });

                        const profileInsertQuery = `
              INSERT INTO user_profiles (${columns.join(', ')})
              VALUES (${placeholders.join(', ')})
            `;

                        await pool.query(profileInsertQuery, values);
                    }
                }

                // Commit the transaction
                await pool.query('COMMIT');

                // Return the updated profile
                return this.findByUserId(userId) as Promise<Profile>;
            } catch (error) {
                // Rollback in case of error
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            logger.error('Error in ProfileModel.update:', error);
            throw error;
        }
    }


    /**
     * Find profiles for multiple users by their IDs
     */
    async findByUserIds(userIds: string[]): Promise<Profile[]> {
        try {
            if (!userIds.length) {
                return [];
            }

            // Get basic profile info from users table
            const userQuery = `
        SELECT id, first_name, last_name, date_of_birth, gender, 
               phone_number, profile_picture, created_at, updated_at
        FROM users
        WHERE id = ANY($1)
      `;

            const userResult = await pool.query(userQuery, [userIds]);

            // Create a map of user IDs to user data
            const userMap = new Map();
            userResult.rows.forEach(user => {
                userMap.set(user.id, user);
            });

            // Get additional profile info from user_profiles table
            const profileQuery = `
        SELECT user_id, preferred_units, notification_preferences, created_at, updated_at
        FROM user_profiles
        WHERE user_id = ANY($1)
      `;

            const profileResult = await pool.query(profileQuery, [userIds]);

            // Create a map of user IDs to profile data
            const profileMap = new Map();
            profileResult.rows.forEach(profile => {
                profileMap.set(profile.user_id, profile);
            });

            // Combine the results for each user ID
            const profiles: Profile[] = [];

            for (const userId of userIds) {
                const user = userMap.get(userId);
                if (!user) continue;

                const profile = profileMap.get(userId) || {};

                profiles.push({
                    id: profile.id || null,
                    user_id: userId,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    date_of_birth: user.date_of_birth,
                    gender: user.gender,
                    phone_number: user.phone_number,
                    profile_picture: user.profile_picture,
                    preferred_units: profile.preferred_units || { weight: 'kg', height: 'cm', distance: 'km' },
                    notification_preferences: profile.notification_preferences || { email: true, push: true, sms: false },
                    created_at: profile.created_at || user.created_at,
                    updated_at: profile.updated_at || user.updated_at
                });
            }

            return profiles;
        } catch (error) {
            logger.error('Error in ProfileModel.findByUserIds:', error);
            throw error;
        }
    }
}