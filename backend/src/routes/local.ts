import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const LOCAL_BASE = process.env.TOI_LOCAL_PATH || '';

function requireLocalPath(res: Response): string | null {
  if (!LOCAL_BASE) {
    res.status(503).json({ error: 'TOI_LOCAL_PATH not configured' });
    return null;
  }
  if (!fs.existsSync(LOCAL_BASE)) {
    res.status(503).json({ error: `Local path not found: ${LOCAL_BASE}` });
    return null;
  }
  return LOCAL_BASE;
}

function getTaskDir(basePath: string, taskId: string): string {
  return path.join(basePath, taskId);
}

function findSolutionFile(taskDir: string): string | null {
  const extensions = ['.py', '.cpp', '.c', '.java', '.pas'];
  const filenames = ['solution', 'main', taskDir.split('/').pop() || ''];
  
  for (const fname of filenames) {
    for (const ext of extensions) {
      const filePath = path.join(taskDir, fname + ext);
      if (fs.existsSync(filePath)) return filePath;
    }
  }
  
  // Search any file with supported extension
  try {
    const files = fs.readdirSync(taskDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        return path.join(taskDir, file);
      }
    }
  } catch {
    return null;
  }
  
  return null;
}

// GET /api/local/tasks - list local task directories
router.get('/tasks', (req: Request, res: Response) => {
  const basePath = requireLocalPath(res);
  if (!basePath) return;

  try {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    const tasks = entries
      .filter(e => e.isDirectory() && /^[A-Z]\d+-\d{3}$/.test(e.name))
      .map(e => {
        const taskDir = path.join(basePath, e.name);
        const solutionFile = findSolutionFile(taskDir);
        const notesPath = path.join(taskDir, 'notes.md');
        const pdfPath = path.join(taskDir, 'problem.pdf');

        return {
          taskId: e.name,
          hasNotes: fs.existsSync(notesPath),
          hasSolution: !!solutionFile,
          hasPdf: fs.existsSync(pdfPath),
          solutionFile: solutionFile ? path.basename(solutionFile) : null,
          solutionExt: solutionFile ? path.extname(solutionFile) : null,
        };
      });

    return res.json({ tasks, basePath });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/local/files/:taskId - list files for a task
router.get('/files/:taskId', (req: Request, res: Response) => {
  const basePath = requireLocalPath(res);
  if (!basePath) return;

  const { taskId } = req.params;
  const taskDir = getTaskDir(basePath, taskId);

  if (!fs.existsSync(taskDir)) {
    return res.json({ files: [], exists: false });
  }

  try {
    const files = fs.readdirSync(taskDir).map(name => ({
      name,
      ext: path.extname(name).toLowerCase(),
      size: fs.statSync(path.join(taskDir, name)).size,
    }));

    const solutionFile = findSolutionFile(taskDir);

    return res.json({
      files,
      exists: true,
      solutionFile: solutionFile ? path.basename(solutionFile) : null,
      hasNotes: files.some(f => f.name === 'notes.md'),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/local/notes/:taskId - read notes.md
router.get('/notes/:taskId', (req: Request, res: Response) => {
  const basePath = requireLocalPath(res);
  if (!basePath) return;

  const { taskId } = req.params;
  const notesPath = path.join(getTaskDir(basePath, taskId), 'notes.md');

  if (!fs.existsSync(notesPath)) {
    return res.json({ content: '', exists: false });
  }

  try {
    const content = fs.readFileSync(notesPath, 'utf-8');
    return res.json({ content, exists: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/local/notes/:taskId - save notes.md
router.put('/notes/:taskId', (req: Request, res: Response) => {
  const basePath = requireLocalPath(res);
  if (!basePath) return;

  const { taskId } = req.params;
  const { content } = req.body;

  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }

  const taskDir = getTaskDir(basePath, taskId);
  const notesPath = path.join(taskDir, 'notes.md');

  try {
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(notesPath, content, 'utf-8');
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/local/solution/:taskId - read solution file (as text)
router.get('/solution/:taskId', (req: Request, res: Response) => {
  const basePath = requireLocalPath(res);
  if (!basePath) return;

  const { taskId } = req.params;
  const taskDir = getTaskDir(basePath, taskId);
  const solutionFile = findSolutionFile(taskDir);

  if (!solutionFile) {
    return res.json({ content: null, filename: null });
  }

  try {
    const content = fs.readFileSync(solutionFile, 'utf-8');
    return res.json({ content, filename: path.basename(solutionFile) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/local/config - get current local path config
router.get('/config', (req: Request, res: Response) => {
  return res.json({
    localPath: LOCAL_BASE || null,
    configured: !!LOCAL_BASE,
    exists: LOCAL_BASE ? fs.existsSync(LOCAL_BASE) : false,
  });
});

export default router;
