import { query } from "../config/database";

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  username: string;
  display_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  firebase_uid: string;
  email: string;
  username: string;
  display_name?: string;
}

export interface UpdateUserInput {
  display_name?: string;
  is_active?: boolean;
}

export class UserModel {
  // Create a new user
  static async create(input: CreateUserInput): Promise<User> {
    const result = await query(
      `INSERT INTO users (firebase_uid, email, username, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.firebase_uid, input.email, input.username, input.display_name || null]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  // Find user by Firebase UID
  static async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE firebase_uid = $1`, [firebaseUid]);
    return result.rows[0] || null;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0] || null;
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0] || null;
  }

  // Update user
  static async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.display_name !== undefined) {
      fields.push(`display_name = $${paramCount++}`);
      values.push(input.display_name);
    }

    if (input.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(input.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE users
       SET ${fields.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  // Delete user (soft delete by setting is_active = false)
  static async softDelete(id: string): Promise<boolean> {
    const result = await query(`UPDATE users SET is_active = false WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Hard delete user
  static async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM users WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Get all users (with pagination)
  static async findAll(limit: number = 20, offset: number = 0): Promise<User[]> {
    const result = await query(
      `SELECT * FROM users
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  // Search users by username or display name
  static async search(searchTerm: string, limit: number = 20): Promise<User[]> {
    const result = await query(
      `SELECT * FROM users
       WHERE is_active = true
       AND (username ILIKE $1 OR display_name ILIKE $1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return result.rows;
  }
}
