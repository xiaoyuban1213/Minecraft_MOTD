/* ============================================================
 * 主题切换：V1（玻璃拟态） / V2（Minecraft 像素风）
 * 通过 body.theme-v1 类切换，选择记忆在 localStorage
 * ============================================================ */
(function () {
  "use strict";

  const STORAGE_KEY = "motd-theme";

  function applyTheme(theme) {
    const isV1 = theme === "v1";
    document.body.classList.toggle("theme-v1", isV1);
    document.body.classList.toggle("theme-v2", !isV1);
    // 更新按钮高亮
    document.querySelectorAll(".theme-toggle .theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
    // 更新标题徽标
    const badge = document.getElementById("versionBadge");
    if (badge) {
      badge.textContent = isV1 ? "V1" : "V2";
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* ignore */
    }
  }

  function init() {
    let saved = "v2";
    try {
      saved = localStorage.getItem(STORAGE_KEY) || "v2";
    } catch (e) {
      /* ignore */
    }
    if (saved !== "v1") saved = "v2";
    applyTheme(saved);

    document.querySelectorAll(".theme-toggle .theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
