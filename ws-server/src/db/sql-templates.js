/**
 * SQL Templates for direct database operations
 * Direct PostgreSQL queries for server-side operations
 */

export const SQL_TEMPLATES = {
  BOARD: {
    GET_BY_USER: `SELECT * FROM boards WHERE created_by = $1 LIMIT 1`,
    CREATE: `INSERT INTO boards (name, description, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    GET_BY_ID: `SELECT * FROM boards WHERE id = $1`,
    UPDATE: `UPDATE boards SET name = $2, description = $3, updated_at = $4 WHERE id = $1 RETURNING *`,
    DELETE: `DELETE FROM boards WHERE id = $1`
  },
  
  TASK: {
    GET_BY_BOARD: `
      SELECT t.*, p.email, p.full_name
      FROM tasks t
      LEFT JOIN profiles p ON t.assigned_to = p.id
      WHERE t.board_id = $1
      ORDER BY t.position ASC
    `,
    CREATE: `
      INSERT INTO tasks (board_id, title, description, status, position, assigned_to, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    UPDATE: `
      UPDATE tasks 
      SET title = $2, description = $3, status = $4, position = $5, assigned_to = $6, updated_at = $7
      WHERE id = $1
      RETURNING *
    `,
    DELETE: `DELETE FROM tasks WHERE id = $1`,
    MOVE: `
      UPDATE tasks 
      SET status = $2, position = $3, updated_at = $4
      WHERE id = $1
    `
  },
  
  PROFILE: {
    GET_BY_ID: `SELECT * FROM profiles WHERE id = $1`,
    CREATE: `INSERT INTO profiles (id, email, full_name, avatar_url, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    UPDATE: `UPDATE profiles SET email = $2, full_name = $3, avatar_url = $4 WHERE id = $1 RETURNING *`
  }
}
