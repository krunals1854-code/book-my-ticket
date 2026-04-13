import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

// Secret key for our VIP passes
const JWT_SECRET = "chaicode_secret_key_123"; 

const pool = new pg.Pool({
  host: "localhost",
  port: 5432, 
  user: "postgres",
  password: "SQL@123",
  database: "sql_class_2_db",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = new express();
app.use(cors());
app.use(express.json()); 

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  
  if (!token) return res.status(401).json({ error: "Stop! You need to login first." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Your pass is fake or expired." });
    req.user = user; 
    next();
  });
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/seats", async (req, res) => {
  const result = await pool.query("select * from seats"); 
  res.send(result.rows);
});

// 1. REGISTER: Create a new account
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Please give a username and password" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username";
    const result = await pool.query(sql, [username, hashedPassword]);

    res.status(201).json({ message: "Yay! Account created.", user: result.rows[0] });
  } catch (ex) {
    // 🕵️‍♂️ OUR DETECTIVE CODE IS HERE!
    console.log("DETECTIVE ERROR:", ex);
    if (ex.code === '23505') return res.status(409).json({ error: "Oops! Username is already taken." });
    res.status(500).json({ error: "Bug found: " + ex.message });
  }
});

// 2. LOGIN: Sign in to your account
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rowCount === 0) return res.status(401).json({ error: "Wrong username or password" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) return res.status(401).json({ error: "Wrong username or password" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login successful!", token: token });
  } catch (ex) {
    res.status(500).json({ error: "Bug found: " + ex.message });
  }
});

// 3. BOOK A SEAT: 
app.put("/:id/:name", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.user.username; 

    const conn = await pool.connect();
    
    try {
      await conn.query("BEGIN");
      
      const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
      const result = await conn.query(sql, [id]);

      if (result.rowCount === 0) {
        await conn.query("ROLLBACK"); 
        return res.status(400).json({ error: "Seat is already taken!" });
      }

      const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
      const updateResult = await conn.query(sqlU, [id, name]); 

      await conn.query("COMMIT");
      res.json({ message: "You booked the seat! Have fun at the movie." });
    } catch (dbEx) {
      await conn.query("ROLLBACK");
      throw dbEx;
    } finally {
      conn.release(); 
    }
  } catch (ex) {
    res.status(500).json({ error: "Bug found: " + ex.message });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));