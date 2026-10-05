/* ============================================================
 * Minecraft 地形剖面背景 - 每次加载随机生成
 * 使用与官方类似的 value noise / fbm 生成 16x16 方块纹理
 * 背景跟随页面滚动（position:absolute 挂在 body 顶部）
 * ============================================================ */
(function () {
  "use strict";

  const BLOCK = 16; // 每方块 16px

  // ---------- 噪声（value noise + fbm，模拟 MC 质感） ----------
  function hash2(x, y, seed) {
    let n = ((x * 374761393 + y * 668265263 + seed * 69069) | 0) & 0x7fffffff;
    n = ((n ^ (n >> 13)) * 1274126177) & 0x7fffffff;
    return (((n ^ (n >> 16)) >>> 0) % 100000) / 100000;
  }
  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, seed, octaves) {
    let amp = 0.5, freq = 1, total = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      total += amp * vnoise(x * freq, y * freq, seed + i);
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / norm;
  }

  // ---------- 颜色 ----------
  function hex(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  const SHADES = {
    grass: ["#5e9b3f", "#6fae4c", "#7cbd4f", "#8fc85e"],
    dirt: ["#6b4423", "#8b5a2b", "#9c6a36", "#a57542"],
    gravel: ["#6e675e", "#827a70", "#8f877a", "#9a9286"],
    stone: ["#707070", "#808080", "#8f8f8f", "#9a9a9a"],
    bedrock: ["#2f2f2f", "#3d3d3d", "#4a4a4a", "#565656"],
    water: ["#35639e", "#3d6fb4", "#4a7ec4", "#5a8fce"],
    lava: ["#d16408", "#e8790c", "#f59e1b", "#f9b53c"]
  };
  const ORES = {
    coal: ["#2a2a2a", "#3b3b3b", "#111111"],
    iron: ["#c9956b", "#d8af93", "#b57e55"],
    gold: ["#f7d45e", "#e8c14a"],
    diamond: ["#4aedc4", "#63e8e8"],
    redstone: ["#e05050", "#c43d3d"],
    lapis: ["#2d4fd8", "#3a63f0"]
  };

  // ---------- 16x16 纹理生成 ----------
  function genTexture(seed, shades, scale) {
    const out = new Array(256);
    const n = shades.length;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = fbm(x * scale, y * scale, seed, 3);
        out[y * 16 + x] = shades[Math.min(n - 1, Math.floor(v * n))];
      }
    }
    return out;
  }
  function genOre(seed, oreShades) {
    const tex = genTexture(seed, SHADES.stone, 0.16);
    let rng = seed;
    const rnd = () => {
      rng = (rng * 16807) % 2147483647;
      return (rng & 0xffff) / 0xffff;
    };
    const count = 8 + Math.floor(rnd() * 5);
    for (let i = 0; i < count; i++) {
      const px = Math.floor(rnd() * 16), py = Math.floor(rnd() * 16);
      tex[py * 16 + px] = oreShades[Math.floor(rnd() * oreShades.length)];
    }
    return tex;
  }
  function buildTextures(seed) {
    const T = {};
    T.stone = genTexture(seed + 404, SHADES.stone, 0.16);
    T.dirt = genTexture(seed + 101, SHADES.dirt, 0.16);
    T.gravel = genTexture(seed + 303, SHADES.gravel, 0.16);
    T.bedrock = genTexture(seed + 121, SHADES.bedrock, 0.18);
    T.water = genTexture(seed + 131, SHADES.water, 0.16);
    T.lava = genTexture(seed + 141, SHADES.lava, 0.2);
    // 草方块侧面：上 4 行草皮 + 下 12 行泥土
    const grassSide = new Array(256);
    for (let y = 0; y < 16; y++) {
      const row = y < 4
        ? genTexture(seed + 202 + y, SHADES.grass, 0.15)
        : T.dirt.slice(y * 16, y * 16 + 16);
      for (let x = 0; x < 16; x++) grassSide[y * 16 + x] = row[x];
    }
    T.grass = grassSide;
    // 矿石
    Object.keys(ORES).forEach((k, i) => { T[k] = genOre(seed + 500 + i * 101, ORES[k]); });
    T.cave = new Array(256).fill("#151515");
    return T;
  }

  // ---------- 地形生成（方块网格） ----------
  function generate(seed, BW, BH, T) {
    const rnd = (() => {
      let s = seed + 999;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s & 0xffff) / 0xffff;
      };
    })();
    const bg = [];
    for (let y = 0; y < BH; y++) bg.push(new Array(BW).fill(null));

    // 地表高度（方块单位）
    const surface = [];
    for (let x = 0; x < BW; x++) {
      const h = Math.round(5 + 2 * Math.sin(x / 8) + Math.sin(x / 4.2 + 1.3) * 1.5 + (rnd() * 2 - 1));
      surface.push(Math.max(3, Math.min(8, h)));
    }
    for (let x = 0; x < BW; x++) {
      const s = surface[x];
      bg[s][x] = "grass";
      for (let yy = s + 1; yy < s + 4 && yy < BH; yy++) bg[yy][x] = rnd() < 0.1 ? "gravel" : "dirt";
      for (let yy = s + 4; yy < BH - 2; yy++) bg[yy][x] = "stone";
    }
    // 湖泊
    const lx0 = 10 + Math.floor(rnd() * 12), lx1 = 26 + Math.floor(rnd() * 14);
    for (let x = lx0; x <= lx1 && x < BW; x++) surface[x] = Math.max(surface[x], 7);
    for (let x = lx0 + 1; x < lx1 - 1 && x < BW; x++) {
      for (let yy = surface[x] - 2; yy < surface[x] && yy >= 0; yy++) bg[yy][x] = "water";
    }
    // 矿石
    const oreKeys = Object.keys(ORES);
    for (let i = 0; i < Math.floor(BW * BH / 80); i++) {
      const o = oreKeys[Math.floor(rnd() * oreKeys.length)];
      const cx = 1 + Math.floor(rnd() * (BW - 3)), cy = 8 + Math.floor(rnd() * (BH - 13));
      for (let yy = cy; yy < cy + 2; yy++) {
        for (let xx = cx; xx < cx + 2; xx++) {
          if (bg[yy] && bg[yy][xx] === "stone") bg[yy][xx] = o;
        }
      }
    }
    // 矿脉
    for (let i = 0; i < 3; i++) {
      const o = Math.random() < 0.6 ? "coal" : "iron";
      const y = 12 + Math.floor(rnd() * (BH - 20)), x = 2 + Math.floor(rnd() * (BW - 12));
      const len = 3 + Math.floor(rnd() * 5);
      for (let j = 0; j < len; j++) {
        if (bg[y] && bg[y][x + j] === "stone") bg[y][x + j] = o;
      }
    }
    // 洞穴
    for (let i = 0; i < 4; i++) {
      const cx = 4 + Math.floor(rnd() * (BW - 9)), cy = 10 + Math.floor(rnd() * (BH - 16));
      const rad = 2 + Math.floor(rnd() * 2);
      for (let yy = cy - rad; yy <= cy + rad; yy++) {
        for (let xx = cx - rad; xx <= cx + rad; xx++) {
          if (yy < 0 || xx < 0 || yy >= BH || xx >= BW) continue;
          const d = Math.hypot(xx - cx, yy - cy);
          if (d < rad + (rnd() * 1.2 - 0.8)) bg[yy][xx] = "cave";
        }
      }
    }
    // 岩浆池
    const px = 4 + Math.floor(rnd() * (BW - 9)), py = BH - 6 + Math.floor(rnd() * 3);
    for (let yy = py; yy < py + 2; yy++) {
      for (let xx = px - 2; xx <= px + 2; xx++) {
        if (bg[yy] && bg[yy][xx]) bg[yy][xx] = "lava";
      }
    }
    // 基岩
    for (let x = 0; x < BW; x++) {
      const top = BH - 2 + Math.floor(rnd() * 2);
      for (let yy = top; yy < BH; yy++) bg[yy][x] = "bedrock";
    }
    return { bg, surface };
  }

  // ---------- 渲染 ----------
  // 预构建 16x16 纹理离屏画布，绘制时用 drawImage 批量贴图（性能快）
  let texCanvases = {};
  function buildTexCanvases(seed) {
    const T = buildTextures(seed);
    texCanvases = {};
    Object.keys(T).forEach((k) => {
      const c = document.createElement("canvas");
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext("2d");
      const img = ctx.createImageData(16, 16);
      const d = img.data;
      for (let i = 0; i < 256; i++) {
        const rgb = hex(T[k][i]);
        const o = i * 4;
        d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      texCanvases[k] = c;
    });
    return T;
  }

  let currentSeed = null;

  function render(forceNew) {
    if (forceNew || currentSeed === null) {
      currentSeed = Math.floor(Math.random() * 1e9);
    }
    const seed = currentSeed;
    let canvas = document.getElementById("terrain-bg");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "terrain-bg";
      document.body.prepend(canvas);
    }
    const W = Math.max(1024, document.documentElement.clientWidth);
    const H = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    const BW = Math.ceil(W / BLOCK), BH = Math.ceil(H / BLOCK);
    const cw = BW * BLOCK, ch = BH * BLOCK;
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";

    const T = buildTexCanvases(seed);
    const { bg } = generate(seed, BW, BH, T);
    const ctx = canvas.getContext("2d");

    // 1) 天空渐变
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, "#79c4f5");
    sky.addColorStop(1, "#cde9fb");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    // 2) 贴方块（drawImage 极快）
    for (let by = 0; by < BH; by++) {
      for (let bx = 0; bx < BW; bx++) {
        const tid = bg[by][bx];
        if (tid === null) continue;
        ctx.drawImage(texCanvases[tid], bx * BLOCK, by * BLOCK);
      }
    }

    // 3) 可读性暗化：顶部压暗保证标题清晰
    const dim = ctx.createLinearGradient(0, 0, 0, ch);
    dim.addColorStop(0, "rgba(15, 18, 32, 0.50)");
    dim.addColorStop(0.35, "rgba(15, 18, 32, 0.12)");
    dim.addColorStop(0.75, "rgba(15, 18, 32, 0.25)");
    dim.addColorStop(1, "rgba(15, 18, 32, 0.35)");
    ctx.fillStyle = dim;
    ctx.fillRect(0, 0, cw, ch);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => render(true));
  } else {
    render(true);
  }
  // 字体/图片加载完后内容高度可能变化，保持同一地形重新铺满
  window.addEventListener("load", () => setTimeout(() => render(false), 100));
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(false), 300);
  });
  // 内容高度变化时（如检测结果面板出现/隐藏）重新铺满背景
  if (typeof ResizeObserver !== "undefined") {
    let fitTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => render(false), 120);
    });
    ro.observe(document.body);
  }
})();
