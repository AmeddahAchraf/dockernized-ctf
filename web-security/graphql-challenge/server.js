// graphql-challenge/server.js
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server-express');
const { Client } = require('pg');

const app = express();

// PostgreSQL client
const client = new Client({
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'ctf_db',
  user: process.env.POSTGRES_USER || 'ctf_user',
  password: process.env.POSTGRES_PASSWORD || 'ctf_password',
  port: 5432,
});

// Initialize database
async function initDB() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data
    await client.query(`
      INSERT INTO users (username, email, password, role) VALUES
      ('admin', 'admin@example.com', 'admin123', 'admin'),
      ('user1', 'user1@example.com', 'password123', 'user'),
      ('user2', 'user2@example.com', 'password456', 'user')
      ON CONFLICT (username) DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO posts (title, content, author_id) VALUES
      ('Welcome Post', 'Welcome to our GraphQL API!', 1),
      ('Secret Admin Post', 'This contains the flag: ${process.env.FLAG_GRAPHQL}', 1),
      ('User Post', 'Just a regular user post', 2)
    `);
    
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initDB();

// GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String
    role: String
    posts: [Post]
  }
  
  type Post {
    id: ID!
    title: String!
    content: String
    author: User
    created_at: String
  }
  
  type Query {
    users: [User]
    user(id: ID!): User
    posts: [Post]
    post(id: ID!): Post
    searchPosts(query: String!): [Post]
  }
  
  type Mutation {
    createUser(username: String!, email: String!, password: String!): User
    createPost(title: String!, content: String!, authorId: ID!): Post
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    users: async () => {
      const result = await client.query('SELECT * FROM users');
      return result.rows;
    },
    user: async (_, { id }) => {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    },
    posts: async () => {
      const result = await client.query('SELECT * FROM posts ORDER BY created_at DESC');
      return result.rows;
    },
    post: async (_, { id }) => {
      const result = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
      return result.rows[0];
    },
    // Vulnerable: SQL injection in search
    searchPosts: async (_, { query }) => {
      // Vulnerable query construction
      const sqlQuery = `SELECT * FROM posts WHERE title ILIKE '%${query}%' OR content ILIKE '%${query}%'`;
      const result = await client.query(sqlQuery);
      return result.rows;
    }
  },
  
  Mutation: {
    createUser: async (_, { username, email, password }) => {
      const result = await client.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [username, email, password]
      );
      return result.rows[0];
    },
    createPost: async (_, { title, content, authorId }) => {
      const result = await client.query(
        'INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3) RETURNING *',
        [title, content, authorId]
      );
      return result.rows[0];
    }
  },
  
  User: {
    posts: async (user) => {
      const result = await client.query('SELECT * FROM posts WHERE author_id = $1', [user.id]);
      return result.rows;
    }
  },
  
  Post: {
    author: async (post) => {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [post.author_id]);
      return result.rows[0];
    }
  }
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Vulnerable: Introspection enabled in production
  playground: true,   // Vulnerable: Playground enabled in production
  context: ({ req }) => {
    return { req };
  }
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  
  // Serve GraphQL Playground
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GraphQL Security Challenge</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .panel { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
          code { background: #f4f4f4; padding: 2px 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>GraphQL Security Challenge</h1>
          <p>Explore our GraphQL API and find the vulnerabilities!</p>
          
          <div class="panel">
            <h3>GraphQL Playground</h3>
            <p>Access the GraphQL Playground at: <a href="/graphql">/graphql</a></p>
          </div>
          
          <div class="panel">
            <h3>Sample Queries</h3>
            <h4>Basic Query:</h4>
            <pre><code>
query {
  users {
    id
    username
    email
  }
}
            </code></pre>
            
            <h4>Introspection Query:</h4>
            <pre><code>
query {
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
            </code></pre>
            
            <h4>Search Posts:</h4>
            <pre><code>
query {
  searchPosts(query: "welcome") {
    id
    title
    content
  }
}
            </code></pre>
          </div>
          
          <div class="panel">
            <h3>Hints</h3>
            <ul>
              <li>GraphQL introspection is enabled - explore the schema</li>
              <li>Look for SQL injection vulnerabilities in search functionality</li>
              <li>Try query batching attacks</li>
              <li>Check for sensitive data in posts</li>
              <li>Use tools like GraphQL Voyager for schema exploration</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  });
  
  app.listen(4000, () => {
    console.log('GraphQL Challenge running on port 4000');
    console.log('GraphQL endpoint: http://localhost:4000/graphql');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
});