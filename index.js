import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { render } from "ejs";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 3000;

// Database connection setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "teachers",
});

db.connect((err) => {
  if (err) {
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Access denied. Check your MySQL credentials.");
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error("Database does not exist.");
    } else {
      throw err; // Rethrow any other MySQL errors or non-MySQL errors
    }
  } else {
    console.log("Connected to database");
  }
});

let adminIsAuthorised = false;
let teacherIsAuthorised = true; // Placeholder for authorization

function passwordCheckAdmin(req, res, next) {
  const password = req.body["password"];
  const username = req.body["username"];
  if (password === "admin123" && username === "admin") {
    adminIsAuthorised = true;
  }
  next();
}

app.use(passwordCheckAdmin);

// Configure EJS and static file serving
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Serve the static HTML file for the teacherDashboard route
app.get("/teacherDashboard", (req, res) => {
  if (teacherIsAuthorised) {
    const skydashPath = path.join(__dirname, "views" ,"teacherDashboard.html");
    res.sendFile(skydashPath, (err) => {
      if (err) {
        console.error("Error sending the file:", err);
        res.status(500).send('Failed to load teacher dashboard.');
      }
    });
  } else {
    res.render("teacherlogin", { error: "Unauthorized access" });
  }
});



// Other routes
app.get("/", (req, res) => res.render("about"));
app.get("/login", (req, res) => res.render("login"));
app.get("/adminlogin", (req, res) => res.render("adminlogin"));
app.get("/teacherlogin", (req, res) => res.render("teacherlogin"));

app.post("/adminDashboard", (req, res) => {
  if (adminIsAuthorised) {
    db.query("SELECT * FROM `teacher info_2`", (err, results) => {
      if (err) {
        console.error("Error retrieving data:", err);
        return res.status(500).send('Database query failed.');
      }

      const fields = Object.keys(results[0] || {}).map(name => ({ name }));
      res.render("adminDashboard", { fields, data: results });
    });
  } else {
    res.render("adminlogin", { error: "Incorrect username or password" });
  }
  adminIsAuthorised = false; // Reset after checking
});

app.get("/teacherInfo", (req, res) => {
  if (teacherIsAuthorised) {
    db.query("SELECT * FROM `teacher info_2`", (err, results) => {
      if (err) {
        console.error("Error retrieving data:", err);
        return res.status(500).send('Database query failed.');
      }

      const fields = Object.keys(results[0] || {}).map(name => ({ name }));
      res.render("teacherInfo", { fields, data: results });
    });
  } else {
    res.render("teacherlogin", { error: "Unauthorized access" });
  }
});

app.get("/teacherInfo/addstaff", (req, res) => {
  res.render("editTeacher");
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).send('Something broke!');
});

app.listen(port, () => console.log(`Server listening on port ${port}`));

// Export the app as a serverless function
export default (req, res) => app(req, res);
