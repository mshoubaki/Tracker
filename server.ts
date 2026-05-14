import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "matrix-data.xml");

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

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
});

const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
});

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
      MatrixData: {
        appTitle: 'مصفوفة مراحل العمليات',
        appDescription: 'Enterprise Status Tracker - تتبع حالة المشاريع بدقة',
        tasks: {
          task: initialTasks
        }
      }
    };
    const xmlContent = builder.build(initialData);
    await fs.writeFile(DATA_FILE, xmlContent);
  }

  // --- API Routes ---

  // Get current state
  app.get("/api/matrix", async (req, res) => {
    try {
      const xmlData = await fs.readFile(DATA_FILE, "utf-8");
      const jsonObj = parser.parse(xmlData);
      
      // Ensure tasks is an array even if there is only 1 or 0 tasks
      let tasks = jsonObj.MatrixData.tasks?.task || [];
      if (!Array.isArray(tasks)) {
        tasks = [tasks];
      }

      res.json({
        appTitle: jsonObj.MatrixData.appTitle,
        appDescription: jsonObj.MatrixData.appDescription,
        tasks: tasks
      });
    } catch (error) {
      console.error("Read Error:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  // Update state
  app.post("/api/matrix", async (req, res) => {
    try {
      const { tasks, appTitle, appDescription } = req.body;
      const dataToSave = {
        MatrixData: {
          appTitle,
          appDescription,
          tasks: {
            task: tasks
          }
        }
      };
      const xmlContent = builder.build(dataToSave);
      await fs.writeFile(DATA_FILE, xmlContent);
      res.json({ status: "success" });
    } catch (error) {
      console.error("Write Error:", error);
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
