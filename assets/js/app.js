const form = document.getElementById("motdForm");
const result = document.getElementById("result");
const error = document.getElementById("error");
const statusEl = document.getElementById("status");
const motdEl = document.getElementById("motd");
const playersEl = document.getElementById("players");
const versionEl = document.getElementById("version");
const hostEl = document.getElementById("host");
const addressEl = document.getElementById("address");
const editionEl = document.getElementById("edition");
const demoBtn = document.getElementById("demoBtn");
const submitBtn = document.getElementById("submitBtn");

window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-enter");
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

function normalizeMotd(motd) {
  if (!motd) return "(无 MOTD)";
  const text = Array.isArray(motd) ? motd.join("\n") : motd;
  return text.replace(/§[0-9A-FK-OR]/gi, "");
}

async function fetchMotd(address, edition) {
  const base = edition === "bedrock" ? "https://api.mcsrvstat.us/bedrock/3/" : "https://api.mcsrvstat.us/3/";
  const url = base + encodeURIComponent(address.trim());
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("network");
  }
  return res.json();
}

function fillResult(data, address) {
  const online = data && data.online;
  statusEl.textContent = online ? "在线" : "离线";
  statusEl.style.color = online ? "#59d2ff" : "#ff6b6b";
  motdEl.textContent = normalizeMotd(data?.motd?.clean || data?.motd?.raw || data?.motd || data?.description);
  playersEl.textContent = data?.players ? `${data.players.online || 0} / ${data.players.max || 0}` : "-";
  versionEl.textContent = data?.version || data?.software || "-";
  hostEl.textContent = data?.ip ? `${data.ip}:${data.port}` : address;
}

function showError(message, hints = []) {
  document.getElementById("errorText").textContent = message;
  const list = document.getElementById("errorHints");
  list.innerHTML = "";
  hints.forEach((hint) => {
    const li = document.createElement("li");
    li.textContent = hint;
    list.appendChild(li);
  });
  error.hidden = false;
  result.hidden = true;
}

function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.classList.add("is-loading");
    submitBtn.setAttribute("disabled", "disabled");
    demoBtn.setAttribute("disabled", "disabled");
  } else {
    submitBtn.classList.remove("is-loading");
    submitBtn.removeAttribute("disabled");
    demoBtn.removeAttribute("disabled");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;
  const address = addressEl.value.trim();
  if (!address) return;
  setLoading(true);
  try {
    const data = await fetchMotd(address, editionEl.value);
    fillResult(data, address);
    result.classList.remove("result-animate");
    void result.offsetWidth;
    result.classList.add("result-animate");
    result.hidden = false;
  } catch (err) {
    showError("检测失败，请检查地址或网络。", [
      "端口未开放或被防火墙拦截。",
      "服务器离线/维护中，暂不可访问。",
      "网络不稳定，或 API 请求被阻断。",
      "地址格式错误，请确认域名/IP 与端口。",
      "Bedrock/Java 版本选择不匹配。"
    ]);
  } finally {
    setLoading(false);
  }
});

demoBtn.addEventListener("click", () => {
  addressEl.value = "mc.hypixel.net";
  editionEl.value = "java";
  form.requestSubmit();
});
