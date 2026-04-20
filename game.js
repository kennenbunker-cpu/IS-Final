const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 800, H = 800;

const STORES = [
  {
    name: "Bakery Bliss", x: 200, y: 68, emoji: "🧁", color: "#ffb3c8",
    items: [{ name: "Croissant", price: 4 }, { name: "Cake Slice", price: 8 }, { name: "Cookie Box", price: 12 }]
  },
  {
    name: "Flower Boutique", x: 600, y: 68, emoji: "🌸", color: "#ffd6e8",
    items: [{ name: "Rose Bouquet", price: 15 }, { name: "Sunflower", price: 5 }, { name: "Potted Plant", price: 22 }]
  },
  {
    name: "Candy Corner", x: 200, y: 732, emoji: "🍬", color: "#ffb3c8",
    items: [{ name: "Lollipop", price: 2 }, { name: "Gummy Bears", price: 5 }, { name: "Chocolate Box", price: 14 }]
  },
  {
    name: "Ice Cream Dreams", x: 600, y: 732, emoji: "🍦", color: "#ffd6e8",
    items: [{ name: "Cone", price: 4 }, { name: "Sundae", price: 9 }, { name: "Milkshake", price: 7 }]
  },
  {
    name: "Cozy Books", x: 68, y: 280, emoji: "📚", color: "#ffc8dd",
    items: [{ name: "Magazine", price: 6 }, { name: "Novel", price: 14 }, { name: "Art Book", price: 28 }]
  },
  {
    name: "Nail Salon", x: 68, y: 520, emoji: "💅", color: "#ffafcc",
    items: [{ name: "Manicure", price: 25 }, { name: "Pedicure", price: 30 }, { name: "Gel Set", price: 45 }]
  },
  {
    name: "Fashion Forward", x: 732, y: 280, emoji: "👜", color: "#ffc8dd",
    items: [{ name: "Hair Clip", price: 8 }, { name: "Scarf", price: 18 }, { name: "Tote Bag", price: 35 }]
  },
  {
    name: "Jewelry Box", x: 732, y: 520, emoji: "💎", color: "#ffafcc",
    items: [{ name: "Earrings", price: 12 }, { name: "Bracelet", price: 22 }, { name: "Necklace", price: 40 }]
  },
];

const SPRITE_SPEED = 260;
const HOME = { x: W / 2, y: H / 2 };
const HIT_RADIUS = 48;

let state = {};

function initState() {
  state = {
    money: 800,
    sx: HOME.x,
    sy: HOME.y,
    tx: HOME.x,
    ty: HOME.y,
    moving: false,
    pendingStore: null,
    dialogOpen: false,
  };
  updateMoneyDisplay();
  hideDialog();
  setStatus('\u00a0');
}

// ─── UI refs ────────────────────────────────────────────────────────────────
const overlay       = document.getElementById('overlay');
const storeEmojiEl  = document.getElementById('storeEmoji');
const storeNameEl   = document.getElementById('storeName');
const itemListEl    = document.getElementById('itemList');
const dialogMsgEl   = document.getElementById('dialogMessage');
const moneyAmtEl    = document.getElementById('moneyAmt');
const statusLineEl  = document.getElementById('statusLine');

function updateMoneyDisplay() {
  moneyAmtEl.textContent = state.money;
}

function setStatus(msg) {
  statusLineEl.textContent = msg || '\u00a0';
}

let msgTimer = null;
function flashMsg(msg) {
  dialogMsgEl.textContent = msg;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { dialogMsgEl.textContent = ''; }, 2200);
}

function showDialog(store) {
  state.dialogOpen = true;
  storeEmojiEl.textContent = store.emoji;
  storeNameEl.textContent = store.name;
  dialogMsgEl.textContent = '';
  setStatus('\u00a0');

  itemListEl.innerHTML = '';
  store.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'item-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.textContent = item.name;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'item-price';
    priceSpan.textContent = `$${item.price}`;

    const btn = document.createElement('button');
    btn.className = 'buy-btn';
    btn.textContent = 'Buy';
    btn.addEventListener('click', () => {
      if (state.money >= item.price) {
        state.money -= item.price;
        updateMoneyDisplay();
        flashMsg(`✓ Bought ${item.name}!`);
      } else {
        flashMsg('Not enough money! 💸');
      }
    });

    row.appendChild(nameSpan);
    row.appendChild(priceSpan);
    row.appendChild(btn);
    itemListEl.appendChild(row);
  });

  overlay.style.display = 'flex';
}

function hideDialog() {
  state.dialogOpen = false;
  overlay.style.display = 'none';
  if (state.sx !== HOME.x || state.sy !== HOME.y) {
    state.tx = HOME.x;
    state.ty = HOME.y;
    state.moving = true;
    setStatus('Heading home…');
  }
}

document.getElementById('closeBtn').addEventListener('click', hideDialog);
document.getElementById('restartBtn').addEventListener('click', initState);

// ─── Canvas interaction ──────────────────────────────────────────────────────
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top)  * (H / rect.height),
  };
}

canvas.addEventListener('mousemove', e => {
  if (state.dialogOpen) return;
  const { x, y } = getCanvasPos(e);
  canvas.style.cursor = STORES.some(s => dist(x, y, s.x, s.y) < HIT_RADIUS) ? 'pointer' : 'default';
});

canvas.addEventListener('click', e => {
  if (state.dialogOpen || state.moving) return;
  const { x, y } = getCanvasPos(e);
  for (const store of STORES) {
    if (dist(x, y, store.x, store.y) < HIT_RADIUS) {
      state.tx = store.x;
      state.ty = store.y;
      state.moving = true;
      state.pendingStore = store;
      setStatus(`Walking to ${store.name}…`);
      return;
    }
  }
});

// ─── Game loop ───────────────────────────────────────────────────────────────
let lastTs = 0;

function update(dt) {
  if (!state.moving) return;

  const dx = state.tx - state.sx;
  const dy = state.ty - state.sy;
  const d  = Math.sqrt(dx * dx + dy * dy);

  if (d < 2) {
    state.sx = state.tx;
    state.sy = state.ty;
    state.moving = false;

    if (state.pendingStore) {
      const store = state.pendingStore;
      state.pendingStore = null;
      showDialog(store);
    } else {
      setStatus('\u00a0');
    }
    return;
  }

  const step = Math.min(d, SPRITE_SPEED * dt);
  state.sx += (dx / d) * step;
  state.sy += (dy / d) * step;
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────
function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground() {
  // Base gradient
  const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 560);
  bg.addColorStop(0, '#fff0f5');
  bg.addColorStop(1, '#fce4ec');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Polka dots
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#e91e8c';
  for (let gx = 50; gx < W; gx += 58) {
    for (let gy = 50; gy < H; gy += 58) {
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Paths from center to each store
  ctx.save();
  ctx.strokeStyle = '#f8bbd0';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  for (const s of STORES) {
    ctx.beginPath();
    ctx.moveTo(HOME.x, HOME.y);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  }
  // Path center lines (dashed, lighter)
  ctx.strokeStyle = '#fce4ec';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 10]);
  for (const s of STORES) {
    ctx.beginPath();
    ctx.moveTo(HOME.x, HOME.y);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Central plaza
  ctx.save();
  ctx.shadowColor = '#f48fb1';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(HOME.x, HOME.y, 72, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd6e8';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(HOME.x, HOME.y, 72, 0, Math.PI * 2);
  ctx.strokeStyle = '#f48fb1';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Plaza label
  ctx.font = 'bold 11px Georgia';
  ctx.fillStyle = '#e91e8c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✨ Town Square ✨', HOME.x, HOME.y + 55);
}

function drawStore(store) {
  const { x, y, emoji, name, color } = store;
  const bw = 82, bh = 66;

  ctx.save();
  ctx.shadowColor = 'rgba(244,143,177,0.6)';
  ctx.shadowBlur = 14;
  roundRect(x - bw / 2, y - bh / 2, bw, bh, 13);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();

  roundRect(x - bw / 2, y - bh / 2, bw, bh, 13);
  ctx.strokeStyle = '#f48fb1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Emoji
  ctx.font = '26px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y - 8);

  // Name (up to two lines)
  ctx.font = 'bold 9.5px Georgia';
  ctx.fillStyle = '#880e4f';
  ctx.textAlign = 'center';
  const words = name.split(' ');
  if (words.length <= 2) {
    ctx.fillText(name, x, y + 18);
  } else {
    ctx.fillText(words.slice(0, 2).join(' '), x, y + 13);
    ctx.fillText(words.slice(2).join(' '), x, y + 24);
  }
}

function drawSprite() {
  const x = state.sx, y = state.sy;

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 14, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e91e8c';
  ctx.fill();
  ctx.restore();

  // Body
  ctx.save();
  ctx.shadowColor = '#e91e8c';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#fce4ec';
  ctx.fill();
  ctx.strokeStyle = '#e91e8c';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Eyes
  ctx.fillStyle = '#880e4f';
  ctx.beginPath();
  ctx.arc(x - 6, y - 3, 2.8, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 3, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(x, y + 2, 7, 0.25, Math.PI - 0.25);
  ctx.strokeStyle = '#880e4f';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Blush
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#e91e8c';
  ctx.beginPath();
  ctx.ellipse(x - 9, y + 4, 5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 9, y + 4, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bow
  ctx.save();
  ctx.fillStyle = '#e91e8c';
  ctx.beginPath();
  ctx.ellipse(x - 7, y - 19, 6, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 7, y - 19, 6, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 19, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#c2185b';
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  for (const s of STORES) drawStore(s);
  drawSprite();
}

function gameLoop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
initState();
requestAnimationFrame(ts => { lastTs = ts; gameLoop(ts); });
