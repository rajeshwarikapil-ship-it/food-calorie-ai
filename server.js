import express from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.send(renderError("No image uploaded"));
  }

  try {
    const imageBuffer = fs.readFileSync(req.file.path);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this image. First decide if this image contains FOOD. " +
                "If it does NOT contain food, respond ONLY with: NOT_FOOD. " +
                "If it DOES contain food, respond with a short food description."
            },
            {
              type: "input_image",
              image_base64: imageBuffer.toString("base64")
            }
          ]
        }
      ]
    });

    const aiText =
      response.output_text?.trim().toUpperCase() || "";

    if (aiText.includes("NOT_FOOD")) {
      return res.send(renderError(
        "This image does not appear to contain food. Please upload a food plate."
      ));
    }

    // FOOD CONFIRMED → show calories
    return res.send(renderResult());

  } catch (err) {
    console.error(err);
    return res.send(renderError("AI analysis failed. Try again."));
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

function renderResult() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
body {
  font-family: Arial, sans-serif;
  background: #f5f6f7;
  margin: 0;
  padding: 0;
}
.container {
  max-width: 420px;
  margin: 40px auto;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
h2 { margin-top: 0; }
hr { margin: 16px 0; }
.pro {
  background: #f0f7ff;
  padding: 12px;
  border-radius: 8px;
}
a { color: #0066ff; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <h2>🍽 Whole Plate Analysis</h2>
    <p><strong>Estimated calories:</strong> 650 – 850 kcal</p>
    <hr/>
    <p>🔒 Daily history is a <strong>Pro feature</strong></p>
    <div class="pro">
      <strong>💎 Go Pro</strong>
      <ul>
        <li>Unlimited AI scans</li>
        <li>Daily calorie history</li>
        <li>Better accuracy</li>
        <li>Mobile app access</li>
      </ul>
    </div>
    <br/>
    <a href="/">← Analyze another plate</a>
  </div>
</body>
</html>
`;
}

function renderError(message) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
body {
  font-family: Arial, sans-serif;
  background: #f5f6f7;
}
.container {
  max-width: 420px;
  margin: 60px auto;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}
</style>
</head>
<body>
  <div class="container">
    <h3>⚠️ ${message}</h3>
    <br/>
    <a href="/">Try again</a>
  </div>
</body>
</html>
`;
}

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
