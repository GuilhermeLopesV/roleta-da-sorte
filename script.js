/* ===== SCRIPT.JS — Roleta da Sorte ===== */

// ─── WHEEL ITEMS ─────────────────────────────────────────────
let items = [
  '🃏 UNO',
  '🔍 Detetive',
  '🎲 War',
  '🐍 Jogo da Memória',
  '🎯 Banco Imobiliário'
];

// Neon palette for segments
const PALETTE = [
  { bg: '#7c4dff', text: '#ffffff' },
  { bg: '#e040fb', text: '#ffffff' },
  { bg: '#00e5ff', text: '#0a0a14' },
  { bg: '#69ff47', text: '#0a0a14' },
  { bg: '#ffea00', text: '#0a0a14' },
  { bg: '#ff6d00', text: '#ffffff' },
  { bg: '#ff4081', text: '#ffffff' },
  { bg: '#40c4ff', text: '#0a0a14' },
  { bg: '#b2ff59', text: '#0a0a14' },
  { bg: '#ff6e40', text: '#ffffff' },
  { bg: '#ea80fc', text: '#0a0a14' },
  { bg: '#18ffff', text: '#0a0a14' },
];

// ─── STATE ────────────────────────────────────────────────────
let currentAngle = 0;
let isSpinning = false;
let history = [];
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

// ─── INIT ─────────────────────────────────────────────────────
function init() {
  spawnParticles();
  renderEditor();
  drawWheel();
}

// ─── DRAW WHEEL ───────────────────────────────────────────────
function drawWheel(angle = 0) {
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = cx - 8;

  ctx.clearRect(0, 0, size, size);

  const numItems = items.length;
  const sliceAngle = (2 * Math.PI) / numItems;

  items.forEach((item, i) => {
    const startAngle = angle + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const color = PALETTE[i % PALETTE.length];

    // Segment
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();

    // Gradient fill
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, lighten(color.bg, 0.3));
    grad.addColorStop(1, color.bg);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = radius * 0.67;
    const lx = cx + Math.cos(midAngle) * labelR;
    const ly = cy + Math.sin(midAngle) * labelR;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);

    const fontSize = Math.max(10, Math.min(14, 200 / numItems));
    ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
    ctx.fillStyle = color.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;

    // Wrap text
    const maxW = radius * 0.55;
    wrapText(ctx, item, 0, 0, maxW, fontSize + 3);

    ctx.restore();
  });

  // Outer ring glow
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(124, 77, 255, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center circle
  const centerR = 28;
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR);
  centerGrad.addColorStop(0, '#e040fb');
  centerGrad.addColorStop(1, '#7c4dff');
  ctx.beginPath();
  ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = '#0a0a14';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center star
  ctx.font = 'bold 18px serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText('★', cx, cy);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  lines.push(line);

  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

// ─── SPIN ─────────────────────────────────────────────────────
function spinWheel() {
  if (isSpinning || items.length < 2) return;
  isSpinning = true;

  const btn = document.getElementById('spinBtn');
  btn.disabled = true;

  // Reset result
  const resultBox = document.getElementById('resultBox');
  resultBox.classList.remove('has-result');
  document.getElementById('resultValue').textContent = 'Girando...';

  // Random spin: 5–10 full rotations + random offset
  const extraSpins = (5 + Math.random() * 5) * 2 * Math.PI;
  const randomOffset = Math.random() * 2 * Math.PI;
  const totalRotation = extraSpins + randomOffset;
  const duration = 4000 + Math.random() * 2000; // 4-6s

  const startAngle = currentAngle;
  const targetAngle = startAngle + totalRotation;
  const startTime = performance.now();

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);

    currentAngle = startAngle + totalRotation * eased;
    drawWheel(currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentAngle = currentAngle % (2 * Math.PI);
      isSpinning = false;
      btn.disabled = false;
      showResult(currentAngle);
    }
  }

  requestAnimationFrame(animate);
}

// ─── RESULT ───────────────────────────────────────────────────
function showResult(angle) {
  const numItems = items.length;
  const sliceAngle = (2 * Math.PI) / numItems;

  // The pointer is at the top (−π/2), so we compute which segment lands there
  // We need to account for the drawing starting at 0 (right), and pointer at top
  const pointerAngle = -Math.PI / 2;
  let normalized = ((pointerAngle - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const winIndex = Math.floor(normalized / sliceAngle) % numItems;

  const winner = items[winIndex];
  const color = PALETTE[winIndex % PALETTE.length];

  // Update result box
  const resultBox = document.getElementById('resultBox');
  const resultValue = document.getElementById('resultValue');
  resultBox.classList.add('has-result');
  resultValue.textContent = winner;

  // Add to history
  addToHistory(winner, color.bg);

  // Show modal after short delay
  setTimeout(() => showModal(winner, winIndex), 400);
}

// ─── MODAL ────────────────────────────────────────────────────
const EMOJIS = ['🎉', '🎊', '🏆', '🌟', '🎁', '🚀', '💥', '✨', '🍀', '🎯'];

function showModal(result, index) {
  const overlay = document.getElementById('modalOverlay');
  const modalResult = document.getElementById('modalResult');
  const modalEmoji = document.getElementById('modalEmoji');

  modalEmoji.textContent = EMOJIS[index % EMOJIS.length];
  modalResult.textContent = result;
  overlay.classList.add('active');

  // Confetti!
  spawnConfetti();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// ─── CONFETTI ─────────────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#7c4dff', '#e040fb', '#00e5ff', '#69ff47', '#ffea00', '#ff6d00', '#ff4081'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-20px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (8 + Math.random() * 8) + 'px';
      piece.style.height = (8 + Math.random() * 8) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      piece.style.animationDelay = '0s';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }, i * 20);
  }
}

// ─── HISTORY ─────────────────────────────────────────────────
function addToHistory(text, color) {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  history.unshift({ text, color, time });

  const list = document.getElementById('historyList');
  const empty = list.querySelector('.history-empty');
  if (empty) empty.remove();

  const li = document.createElement('li');
  li.className = 'history-item';
  li.innerHTML = `
    <span class="history-dot" style="background:${color}; box-shadow:0 0 6px ${color}"></span>
    <span class="history-text">${text}</span>
    <span class="history-time">${time}</span>
  `;
  list.prepend(li);
}

function clearHistory() {
  history = [];
  const list = document.getElementById('historyList');
  list.innerHTML = '<li class="history-empty">Nenhum giro ainda.</li>';
}

// ─── EDITOR ───────────────────────────────────────────────────
function renderEditor() {
  const list = document.getElementById('itemsList');
  list.innerHTML = '';

  items.forEach((item, i) => {
    const color = PALETTE[i % PALETTE.length];
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <span class="item-color-dot" style="background:${color.bg}; box-shadow: 0 0 6px ${color.bg}"></span>
      <input class="item-input" type="text" value="${escapeHtml(item)}" placeholder="Item ${i + 1}" data-index="${i}" />
      <button class="item-remove" onclick="removeItem(${i})" title="Remover">✕</button>
    `;
    list.appendChild(row);
  });

  document.getElementById('editorCount').textContent = `${items.length} itens`;
}

function addItem() {
  if (items.length >= 12) {
    alert('Máximo de 12 itens!');
    return;
  }
  items.push('Novo Item');
  renderEditor();
  drawWheel(currentAngle);

  // Auto-scroll to bottom and focus last input
  const list = document.getElementById('itemsList');
  list.scrollTop = list.scrollHeight;
  const inputs = list.querySelectorAll('.item-input');
  const last = inputs[inputs.length - 1];
  if (last) { last.focus(); last.select(); }
}

function removeItem(index) {
  if (items.length <= 2) {
    alert('A roleta precisa ter pelo menos 2 itens!');
    return;
  }
  items.splice(index, 1);
  renderEditor();
  drawWheel(currentAngle);
}

function applyItems() {
  const inputs = document.querySelectorAll('.item-input');
  items = Array.from(inputs).map(inp => inp.value.trim() || 'Item');
  renderEditor();
  drawWheel(currentAngle);

  // Flash the apply button
  const btn = document.getElementById('btnApply');
  btn.textContent = '✓ Aplicado!';
  setTimeout(() => { btn.innerHTML = '<span>✓</span> Aplicar'; }, 1500);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── PARTICLES ────────────────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('particles');
  const colors = ['#7c4dff', '#e040fb', '#00e5ff', '#69ff47', '#ffea00'];

  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${8 + Math.random() * 15}s;
      animation-delay: ${Math.random() * -20}s;
      box-shadow: 0 0 ${size * 2}px currentColor;
    `;
    container.appendChild(p);
  }
}

// ─── CANVAS CLICK ─────────────────────────────────────────────
canvas.addEventListener('click', () => {
  if (!isSpinning) spinWheel();
});

// ─── START ────────────────────────────────────────────────────
init();
