/* Pengembara Selamat – SK 2.5.1: Mengenal & menamakan tempat/kawasan yang boleh mendatangkan bahaya di sekolah */
const P = [
  { n: "Tempat Pembuangan Sampah", e: "🗑️", x: "🦟", d: 1, w: "Kotor, ada kuman dan benda tajam." },
  { n: "Bilik Suis", e: "⚡", x: "🔌", d: 1, w: "Ada elektrik. Boleh kena renjatan!" },
  { n: "Stor", e: "📦", x: "🧰", d: 1, w: "Barang berat boleh jatuh dan ada alat tajam." },
  { n: "Makmal", e: "🧪", x: "🔬", d: 1, w: "Ada bahan kimia dan kaca yang mudah pecah." },
  { n: "Bilik Darjah", e: "🏫", x: "📝", d: 0, w: "Tempat ini selamat untuk belajar." },
  { n: "Perpustakaan", e: "📚", x: "📖", d: 0, w: "Tempat ini selamat untuk membaca." },
  { n: "Padang", e: "⚽", x: "🏃", d: 0, w: "Tempat ini selamat untuk bermain." },
  { n: "Kantin", e: "🍜", x: "🥤", d: 0, w: "Tempat ini selamat untuk makan." }
];
const DANGER = P.filter(p => p.d);
const ACTS = [
  { id: "learn", i: "👀", t: "Kenali Tempat", s: "Lihat dan dengar" },
  { id: "match", i: "🔤", t: "Padan Nama", s: "Gambar dan nama" },
  { id: "listen", i: "👂", t: "Dengar & Pilih", s: "Dengar, pilih gambar" },
  { id: "hazard", i: "⚠️", t: "Bahaya atau Selamat?", s: "Tempat mana bahaya?" },
  { id: "map", i: "🗺️", t: "Cari di Peta", s: "Cari 4 tempat bahaya" },
  { id: "memory", i: "🃏", t: "Kad Ingatan", s: "Cari pasangan kad" }
];
const $ = id => document.getElementById(id);
const sh = a => [...a].sort(() => Math.random() - .5);
const PRAISE = ["Bagus!", "Betul!", "Hebat!", "Pandai!"];
const pick = a => a[Math.floor(Math.random() * a.length)];
let save = JSON.parse(localStorage.getItem("bahaya") || "{}"), cur;

/* ---------- Bunyi & suara ---------- */
let muted = localStorage.getItem("bahaya-mute") === "1", AC;
function tone(f, d = .12, type = "sine", v = .15, delay = 0, to) {
  if (muted) return;
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
const N = n => 440 * Math.pow(2, (n - 9) / 12);
const sfx = {
  click() { tone(N(12), .07, "triangle", .12); tone(N(19), .08, "triangle", .08, .04); },
  ok() { [16, 19, 24].forEach((n, i) => tone(N(n), .14, "sine", .14, i * .08)); },
  no() { tone(N(5), .18, "triangle", .12, 0, N(0)); },
  flip() { tone(N(17), .06, "square", .05); },
  win() { [12, 16, 19, 24, 28, 31, 36].forEach((n, i) => { tone(N(n), i === 6 ? .7 : .14, "square", .06, i * .1); tone(N(n - 12), i === 6 ? .7 : .14, "triangle", .1, i * .1); }); }
};
function say(t) {
  if (muted || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang = "ms-MY"; u.rate = .85; speechSynthesis.speak(u);
}
document.addEventListener("pointerdown", e => { if (e.target.closest(".btn:not(#mute),.act,.spk")) sfx.click(); });

/* ---------- Menu ---------- */
function menu() {
  $("play").classList.add("hidden"); $("menu").classList.remove("hidden");
  $("acts").innerHTML = ACTS.map(a => `<button class="act" data-id="${a.id}"><div class="ic">${a.i}</div>
    <div><b>${a.t}</b><span>${a.s}</span><em>${"⭐".repeat(save[a.id] || 0) || "☆☆☆"}</em></div></button>`).join("");
  $("hud").textContent = `⭐ ${Object.values(save).reduce((a, b) => a + b, 0)} / ${ACTS.length * 3}`;
}
$("acts").onclick = e => { const b = e.target.closest(".act"); if (b) start(b.dataset.id); };
function start(id) {
  cur = id; const a = ACTS.find(x => x.id === id);
  $("menu").classList.add("hidden"); $("play").classList.remove("hidden"); $("modal").classList.add("hidden");
  $("title").textContent = a.i + " " + a.t; prog(0, 1);
  ({ learn, match: () => quiz(matchRounds()), listen: () => quiz(listenRounds()), hazard: () => quiz(hazardRounds()), map, memory })[id]();
}
const prog = (i, n) => { $("prog").style.width = (i / n * 100) + "%"; };
$("stage").addEventListener("click", e => { const s = e.target.closest("[data-say]"); if (s) say(s.dataset.say); });

function finish(miss) {
  const s = miss === 0 ? 3 : miss <= 2 ? 2 : 1;
  save[cur] = Math.max(save[cur] || 0, s); localStorage.setItem("bahaya", JSON.stringify(save));
  prog(1, 1); sfx.win(); say("Tahniah! Awak hebat!");
  $("r-stars").textContent = "⭐".repeat(s) + "☆".repeat(3 - s);
  $("modal").classList.remove("hidden");
}

/* ---------- Enjin kuiz (Padan Nama, Dengar & Pilih, Bahaya/Selamat) ---------- */
function quiz(rounds) {
  let i = 0, miss = 0, wrong = 0;
  const show = () => {
    wrong = 0; prog(i, rounds.length); const r = rounds[i];
    $("stage").innerHTML = `<div class="q">${r.q}</div><div class="opts">${r.opts.map((o, k) =>
      `<button class="opt ${o.c || ""}" data-k="${k}">${o.h}</button>`).join("")}</div><div class="fb" id="fb"></div>`;
    if (r.say) setTimeout(() => say(r.say), 300);
  };
  $("stage").onclick = e => {
    const b = e.target.closest(".opt"); if (!b) return;
    const r = rounds[i], o = r.opts[b.dataset.k];
    if (o.ok) {
      sfx.ok(); b.classList.add("ok"); $("fb").textContent = r.fb || pick(PRAISE) + " 🎉"; say(r.fbSay || pick(PRAISE));
      $("stage").onclick = null;
      setTimeout(() => { i++; i < rounds.length ? (show(), $("stage").onclick = h) : finish(miss); }, 1700);
    } else {
      miss++; wrong++; sfx.no(); b.classList.add("no"); $("fb").textContent = "Cuba lagi, awak boleh! 💪";
      if (wrong >= 2) $("stage").querySelectorAll(".opt").forEach((x, k) => r.opts[k].ok && x.classList.add("hint"));
    }
  };
  const h = $("stage").onclick; show();
}
const names = (ok, n = 3) => sh([ok, ...sh(P.filter(p => p !== ok)).slice(0, n - 1)]);
function matchRounds() {
  return sh([...DANGER, pick(DANGER)]).map(p => ({
    q: `<div class="pic">${p.e}${p.x}</div>Apakah nama tempat ini?`, say: "Apakah nama tempat ini?",
    opts: names(p).map(o => ({ h: o.n, ok: o === p })), fbSay: p.n
  }));
}
function listenRounds() {
  return sh([...DANGER, pick(DANGER)]).map(p => ({
    q: `<button class="spk" data-say="Pilih ${p.n}">🔊 Dengar semula</button>Pilih gambar: <b>${p.n}</b>`, say: "Pilih " + p.n,
    opts: names(p).map(o => ({ h: o.e, c: "big", ok: o === p })), fbSay: p.n
  }));
}
function hazardRounds() {
  return sh(P).map(p => ({
    q: `<div class="pic">${p.e}${p.x}</div><b>${p.n}</b>`, say: p.n + ". Bahaya atau selamat?",
    opts: [{ h: "⚠️ Bahaya", c: "bad", ok: !!p.d }, { h: "✅ Selamat", c: "safe", ok: !p.d }],
    fb: p.w, fbSay: p.w
  }));
}

/* ---------- Kenali Tempat ---------- */
function learn() {
  const seen = new Set();
  $("stage").onclick = null;
  $("stage").innerHTML = `<div class="q">Ketik setiap gambar untuk kenali tempat bahaya.</div>
    <div class="tiles">${DANGER.map((p, k) => `<button class="tile" data-k="${k}"><div class="pic">${p.e}</div><b>${p.n}</b></button>`).join("")}</div>
    <div id="detail"></div>`;
  $("stage").onclick = e => {
    const t = e.target.closest(".tile"); if (!t) return;
    const p = DANGER[t.dataset.k]; seen.add(p); t.classList.add("seen"); sfx.ok(); prog(seen.size, 4);
    $("detail").innerHTML = `<div class="detail"><div class="pic">${p.e}${p.x}</div><h3>${p.n}</h3>
      <p>⚠️ ${p.w}</p><button class="spk" data-say="${p.n}. ${p.w}">🔊 Dengar</button></div>`;
    say(p.n + ". " + p.w);
    if (seen.size === 4) setTimeout(() => { $("stage").onclick = null; finish(0); }, 4500);
  };
}

/* ---------- Cari di Peta ---------- */
function map() {
  let found = 0, miss = 0;
  $("stage").innerHTML = `<div class="q">Ketik <b>4 tempat bahaya</b> di sekolah.</div>
    <div class="tiles">${sh(P).map(p => `<button class="tile" data-n="${p.n}"><div class="pic">${p.e}</div><b>${p.n}</b></button>`).join("")}</div>
    <div class="fb" id="fb"></div>`;
  say("Ketik empat tempat bahaya di sekolah.");
  $("stage").onclick = e => {
    const t = e.target.closest(".tile"); if (!t || t.classList.contains("found")) return;
    const p = P.find(x => x.n === t.dataset.n);
    if (p.d) {
      t.classList.add("found"); found++; sfx.ok(); prog(found, 4); $("fb").textContent = p.w; say(p.n + ". " + p.w);
      if (found === 4) { $("stage").onclick = null; setTimeout(() => finish(miss), 3500); }
    } else {
      miss++; sfx.no(); t.classList.add("shake"); setTimeout(() => t.classList.remove("shake"), 400);
      $("fb").textContent = p.n + " selamat. Cuba lagi! 💪";
    }
  };
}

/* ---------- Kad Ingatan ---------- */
function memory() {
  const cards = sh(DANGER.flatMap(p => [{ k: p.n, h: p.e + p.x, em: 1 }, { k: p.n, h: p.n }]));
  let open = [], lock = false, pairs = 0, miss = 0;
  $("stage").innerHTML = `<div class="q">Cari pasangan: gambar dan nama tempat.</div>
    <div class="mem">${cards.map((c, i) => `<button class="card2" data-i="${i}">❓</button>`).join("")}</div>`;
  $("stage").onclick = e => {
    const b = e.target.closest(".card2"); if (!b || lock || b.classList.contains("open")) return;
    const c = cards[b.dataset.i]; b.classList.add("open"); if (c.em) b.classList.add("em"); b.textContent = c.h;
    sfx.flip(); say(c.k); open.push([b, c]);
    if (open.length < 2) return;
    const [[b1, c1], [b2, c2]] = open; open = [];
    if (c1.k === c2.k) {
      b1.classList.add("done"); b2.classList.add("done"); pairs++; sfx.ok(); prog(pairs, 4);
      if (pairs === 4) setTimeout(() => finish(miss), 1200);
    } else {
      miss++; lock = true; setTimeout(() => { [b1, b2].forEach(x => { x.classList.remove("open", "em"); x.textContent = "❓"; }); lock = false; sfx.no(); }, 1100);
    }
  };
}

/* ---------- Butang ---------- */
$("back").onclick = () => { speechSynthesis && speechSynthesis.cancel(); menu(); };
$("r-menu").onclick = () => { $("modal").classList.add("hidden"); menu(); };
$("r-again").onclick = () => start(cur);
const syncMute = () => { $("mute").textContent = muted ? "🔇" : "🔊"; };
$("mute").onclick = () => { muted = !muted; localStorage.setItem("bahaya-mute", muted ? "1" : "0"); syncMute(); if (muted) speechSynthesis && speechSynthesis.cancel(); else sfx.click(); };
syncMute(); menu();
