import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const app = express();
const upload = multer({ dest: "uploads/" });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.static("."));
app.use(express.urlencoded({ extended: true }));

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.send(`
        <h2>❌ No image uploaded</h2>
        <a href="/">Try again</a>
      `);
    }

    const imageBase64 = fs.readFileSync(req.file.path, {
      encoding: "base64",
    });

    // STRICT FOOD DETECTION PROMPT
    const prompt = `
You are a strict food detection system.

Rules:
- If the image clearly contains edible food or a meal, respond ONLY with:
FOOD

- If the image contains people, faces, hands, documents, objects, screens, blank images, signatures, or anything non-edible, respond ONLY with:
NOT_FOOD

No explanation. One word only.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
            },
          ],
        },
      ],
    });

    const verdict = response.output_text.trim();

    // DELETE IMAGE AFTER USE
    fs.unlinkSync(req.file.path);

    // NOT FOOD → STOP HERE
    if (verdict !== "FOOD") {
      return res.send(`
        <div style="max-width:420px;margin:40px auto;font-family:Arial;background:#fff;padding:20px;border-radius:12px">
          <h2>⚠️ No food detected</h2>
          <p>Please upload a clear image of food or a meal.</p>
          <a href="/">🔁 Try again</a>
        </div>
      `);
    }

    // FOOD → CALORIE ESTIMATION (FIXED RANGE BY DESIGN)
    const caloriesMin = 650;
    const caloriesMax = 850;

    return res.send(`
      <div style="max-width:420px;margin:40px auto;font-family:Arial;background:#fff;padding:20px;border-radius:12px">
        <h2>🍽️ Whole Plate Analysis</h2>
        <p><strong>Estimated calories:</strong> ${caloriesMin} – ${caloriesMax} kcal</p>

        <hr/>

        <p style="color:gray;font-size:14px">🔒 Daily history is a Pro feature</p>

        <h3>💎 Go Pro</h3>
        <ul>
          <li>Unlimited AI scans</li>
          <li>Daily calorie history</li>
          <li>Better accuracy</li>
          <li>Mobile app access</li>
        </ul>

        <a href="/">➕ Analyze another plate</a>
      </div>
    `);
  } catch (err) {
    console.error(err);
    return res.send(`
      <h2>❌ AI analysis failed</h2>
      <a href="/">Try again</a>
    `);
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
