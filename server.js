const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TIPS_FILE = path.join(DATA_DIR, 'tips.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TIPS_FILE)) fs.writeFileSync(TIPS_FILE, '[]', 'utf-8');

app.use(express.json());
app.use(express.static(__dirname));

function readTips() {
  try {
    return JSON.parse(fs.readFileSync(TIPS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeTips(tips) {
  fs.writeFileSync(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf-8');
}

app.post('/api/tips', (req, res) => {
  const { name, email, category, title, content, tags } = req.body;
  if (!name || !email || !category || !title || !content) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  if (content.length < 50) {
    return res.status(400).json({ error: 'Conteúdo deve ter no mínimo 50 caracteres' });
  }

  const tips = readTips();
  const tip = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, email, category, title, content,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  tips.unshift(tip);
  writeTips(tips);
  res.status(201).json(tip);
});

app.get('/api/tips', (req, res) => {
  const { status, category } = req.query;
  let tips = readTips();
  if (status) tips = tips.filter(t => t.status === status);
  if (category) tips = tips.filter(t => t.category === category);
  res.json(tips);
});

app.put('/api/tips/:id/approve', (req, res) => {
  const tips = readTips();
  const tip = tips.find(t => t.id === req.params.id);
  if (!tip) return res.status(404).json({ error: 'Dica não encontrada' });
  tip.status = 'approved';
  writeTips(tips);
  res.json(tip);
});

app.put('/api/tips/:id/reject', (req, res) => {
  const tips = readTips();
  const tip = tips.find(t => t.id === req.params.id);
  if (!tip) return res.status(404).json({ error: 'Dica não encontrada' });
  tip.status = 'rejected';
  writeTips(tips);
  res.json(tip);
});

app.delete('/api/tips/:id', (req, res) => {
  let tips = readTips();
  const index = tips.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Dica não encontrada' });
  tips.splice(index, 1);
  writeTips(tips);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
