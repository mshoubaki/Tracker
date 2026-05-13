import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import cors from "cors";

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "matrix-data.json");

const INITIAL_TASKS_TITLES = [
  'صوتك مسموع',
  'الموردين',
  'المكتبة الرقمية',
  'إدامة',
  'طلبات الدعم',
  'إنصاف',
  'تقييم الكفاءات',
  'التحقق من الشهادات',
  'معادلة الشهادات',
  'سنابل',
  'تكافل',
  'المسح الميداني',
  'عبور',
  'الإيفاد الخارجي',
  'الإسكان',
  'الحج'
];

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Ensure data file exists or initialize it
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialTasks = INITIAL_TASKS_TITLES.map((title, idx) => ({
      id: Math.random().toString(36).substring(7),
      title,
      phases: { 
        BRD: 'not-started',
        UX: 'not-started',
        API: 'not-started', 
        Dev: 'not-started', 
        QC: 'not-started' 
      },
      createdAt: Date.now() - idx * 1000,
    }));

    const initialData = {
      tasks: initialTasks,
      appTitle: 'مصفوفة مراحل العمليات',
      appDescription: 'Enterprise Status Tracker - تتبع حالة المشاريع بدقة'
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }

  // --- API Routes ---

  // Get current state
  app.get("/api/matrix", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  // Update state
  app.post("/api/matrix", async (req, res) => {
    try {
      const { tasks, appTitle, appDescription } = req.body;
      const dataToSave = { tasks, appTitle, appDescription };
      await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2));
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // --- Vite / Static Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
