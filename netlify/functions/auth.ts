import { Handler } from '@netlify/functions';

// Simple authentication for Netlify deployment
const AUTHORIZED_USER_ID = "46429020";
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "fintrak2025";

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.path.includes('/login')) {
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
      }

      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username and password required' }) };
      }

      const { username, password } = JSON.parse(event.body);

      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        return { 
          statusCode: 200, 
          headers: {
            ...headers,
            'Set-Cookie': `auth-token=${AUTHORIZED_USER_ID}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
          }, 
          body: JSON.stringify({ 
            success: true, 
            user: { id: AUTHORIZED_USER_ID, username: VALID_USERNAME } 
          }) 
        };
      } else {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }
    }

    if (event.path.includes('/logout')) {
      return { 
        statusCode: 200, 
        headers: {
          ...headers,
          'Set-Cookie': 'auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
        }, 
        body: JSON.stringify({ success: true }) 
      };
    }

    if (event.path.includes('/user')) {
      // Check for auth token in cookies
      const cookies = event.headers.cookie || '';
      const authToken = cookies.split(';').find(c => c.trim().startsWith('auth-token='));
      
      if (authToken && authToken.split('=')[1] === AUTHORIZED_USER_ID) {
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify({ 
            id: AUTHORIZED_USER_ID, 
            username: VALID_USERNAME 
          }) 
        };
      } else {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error) {
    console.error('Auth error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};