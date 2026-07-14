const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const nodemailer = require('nodemailer');

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

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendApprovalEmail(tip) {
  const transporter = getTransporter();
  if (!transporter || !tip.email) return;
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const categorySlug = encodeURIComponent(tip.category || '');
  try {
    await transporter.sendMail({
      from: `"Portal de Estágio IFRO" <${process.env.GMAIL_USER}>`,
      to: tip.email,
      subject: 'Sua dica foi aprovada no Portal de Estágio IFRO',
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#212529;">
          <h2 style="color:#003366;margin-top:0;">Olá, ${tip.name || 'estudante'}!</h2>
          <p>Sua dica <strong>"${tip.title}"</strong> foi <strong style="color:#28a745;">aprovada</strong> e já está publicada no Portal de Estágio do IFRO Campus Ariquemes.</p>
          <p>Obrigado por contribuir com a comunidade de estagiários de informática!</p>
          <p style="margin:24px 0;">
            <a href="${siteUrl}/pages/dicas/index.html?cat=${categorySlug}" style="background:#003366;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Ver minha dica publicada</a>
          </p>
          <hr style="border:none;border-top:1px solid #dee2e6;margin:24px 0;">
          <p style="font-size:12px;color:#6c757d;">Portal de Estágio IFRO Campus Ariquemes &bull; Gerido por estudantes de informática.</p>
        </div>`
    });
  } catch (err) {
    console.error('Erro ao enviar e-mail de aprovação:', err.message);
  }
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
  sendApprovalEmail(tip);
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
