import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret_change_in_production';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    // Simple validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password required' }
      });
    }
    
    // Demo login - works without database
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: token,
          token: token, // Backward compatibility
          user: {
            id: 1,
            username: 'admin',
            name: 'Admin User',
            email: 'admin@example.com'
          }
        }
      });
    }
    
    // Try database if available
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const users = await sql`
          SELECT id, username, password_hash, name, email, active 
          FROM users 
          WHERE username = ${username} AND active = true
        `;
        
        if (users.length > 0) {
          const user = users[0];
          const valid = await bcrypt.compare(password, user.password_hash);
          
          if (valid) {
            const token = jwt.sign(
              { id: user.id, username: user.username },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            
            return res.status(200).json({
              success: true,
              message: 'Login successful',
              data: {
                accessToken: token,
                token: token,
                user: {
                  id: user.id,
                  username: user.username,
                  name: user.name,
                  email: user.email
                }
              }
            });
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError.message);
        // Fall through to invalid credentials
      }
    }
    
    // Invalid credentials
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Login failed: ' + error.message }
    });
  }
}
