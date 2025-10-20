import { query } from "../config/database";

export interface Profile {
  id: string;
  user_id: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  birth_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProfileInput {
  user_id: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  birth_date?: Date;
}

export interface UpdateProfileInput {
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  birth_date?: Date;
}

export class ProfileModel {
  // Create a new profile
  static async create(input: CreateProfileInput): Promise<Profile> {
    const result = await query(
      `INSERT INTO profiles (user_id, bio, location, website, avatar_url, cover_image_url, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.user_id,
        input.bio || null,
        input.location || null,
        input.website || null,
        input.avatar_url || null,
        input.cover_image_url || null,
        input.birth_date || null,
      ]
    );
    return result.rows[0];
  }

  // Find profile by user ID
  static async findByUserId(userId: string): Promise<Profile | null> {
    const result = await query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
    return result.rows[0] || null;
  }

  // Find profile by ID
  static async findById(id: string): Promise<Profile | null> {
    const result = await query(`SELECT * FROM profiles WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  // Update profile
  static async update(userId: string, input: UpdateProfileInput): Promise<Profile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(input.bio);
    }

    if (input.location !== undefined) {
      fields.push(`location = $${paramCount++}`);
      values.push(input.location);
    }

    if (input.website !== undefined) {
      fields.push(`website = $${paramCount++}`);
      values.push(input.website);
    }

    if (input.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(input.avatar_url);
    }

    if (input.cover_image_url !== undefined) {
      fields.push(`cover_image_url = $${paramCount++}`);
      values.push(input.cover_image_url);
    }

    if (input.birth_date !== undefined) {
      fields.push(`birth_date = $${paramCount++}`);
      values.push(input.birth_date);
    }

    if (fields.length === 0) {
      return this.findByUserId(userId);
    }

    values.push(userId);

    const result = await query(
      `UPDATE profiles
       SET ${fields.join(", ")}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  // Delete profile
  static async delete(userId: string): Promise<boolean> {
    const result = await query(`DELETE FROM profiles WHERE user_id = $1`, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Create or update profile (upsert)
  static async upsert(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      const updated = await this.update(userId, input);
      return updated!;
    } else {
      return await this.create({ user_id: userId, ...input });
    }
  }
}
