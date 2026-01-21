const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const upload = multer({ dest: "uploads/" });

/* =====================
   CONFIG
===================== */
const DAILY_LIMIT = 3;
const IS_PRO = false; // ← change to true to demo PRO

const usage = {};   // { ip: { date, count } }
const history = {}; // { ip: { date, records: [] } }

function today() {
  return new Date().toDateString();
}

/* =====================
   ROUTES
===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/upload", upload.single("image"), (req, res) => {
  const ip = req.ip;
  const date = today();

  if (!usage[ip] || usage[ip].date !== date) {
    usage[ip] = { date, count: 0 };
    history[ip] = { date, records: [] };
  }

  if (!IS_PRO && usage[ip].count >= DAILY_LIMIT) {
    return res.send(`
      <h2>🚫 Free Limit Reached</h2>
      <p>You have used ${DAILY_LIMIT} free scans today.</p>
      <p><strong>Upgrade to Pro</strong> to unlock:</p>
      <ul>
        <li>📊 Daily calorie history</li>
        <li>🤖 Unlimited AI scans</li>
        <li>📱 Mobile app access</li>
      </ul>
      <a href="/">← Go back</a>
    `);
  }

  usage[ip].count++;

  /* ===== AI RESULT (STABLE MOCK, AI ALREADY WORKING) ===== */
  const minCalories = 650;
  const maxCalories = 850;
  const now = new Date().toLocaleTimeString();

  history[ip].records.push({
    time: now,
    calories: `${minCalories} – ${maxCalories}`
  });

  const totalToday = history[ip].records.length * 750;

  const historyHTML = history[ip].records
    .map(r => `<li>${r.time} — ${r.calories} kcal</li>`)
    .join("");

  res.send(`
    <h2>🍽️ Whole Plate Analysis</h2>
    <p><strong>Estimated calories:</strong> ${minCalories} – ${maxCalories} kcal</p>

    <hr/>

    ${
      IS_PRO
        ? `
          <h3>📊 Today’s History</h3>
          <ul>${historyHTML}</ul>
          <p><strong>Total today:</strong> ${totalToday} kcal</p>
        `
        : `
          <p style="color:gray">
            🔒 Daily history is a <strong>Pro feature</strong>
          </p>
        `
    }

    <hr/>
    <h3>💎 Go Pro</h3>
    <ul>
      <li>Unlimited AI scans</li>
      <li>Daily calorie history</li>
      <li>Better AI accuracy</li>
      <li>Mobile app access</li>
    </ul>

    <a href="/">← Analyze another plate</a>
  `);
});

/* =====================
   START
===================== */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
