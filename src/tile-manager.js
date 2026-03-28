const TILE_DEFS_STORAGE_KEY = "microgame_tile_defs_v1";
const TILE_ATLAS_SRC = "./assets/tileset_platform.svg";
const TILE_SIZE = 32;

const DEFAULT_TILE_DEFS = [
  { id: 0, name: "Piso", color: "#7ebc56", tx: 0, ty: 0, solid: true, slippery: false, breakable: false, locked: true },
  { id: 1, name: "Bloque rompible", color: "#8f7a66", tx: 1, ty: 0, solid: true, slippery: false, breakable: true, locked: true },
  { id: 2, name: "Piso resbaladizo", color: "#6d8ba9", tx: 2, ty: 0, solid: true, slippery: true, breakable: false, locked: true },
  { id: 3, name: "Atravesable", color: "#b88ad1", tx: 3, ty: 0, solid: false, slippery: false, breakable: false, locked: true },
  {
    id: 4,
    name: "Plataforma animada",
    color: "#5ab4ff",
    tx: 4,
    ty: 0,
    solid: true,
    slippery: false,
    breakable: false,
    animated: true,
    animationMs: 170,
    animationFrames: [{ tx: 4, ty: 0 }, { tx: 5, ty: 0 }, { tx: 6, ty: 0 }, { tx: 7, ty: 0 }],
    locked: true
  }
];

const tilesBody = document.getElementById("tilesBody");
const statusEl = document.getElementById("status");
const btnSave = document.getElementById("btnSave");
const btnAdd = document.getElementById("btnAdd");
const btnReset = document.getElementById("btnReset");

let tileDefs = loadTileDefs();
let atlasImage = null;

renderRows();
loadAtlasImage();

btnSave.addEventListener("click", () => {
  tileDefs = readRows();
  localStorage.setItem(TILE_DEFS_STORAGE_KEY, JSON.stringify(tileDefs));
  renderRows();
  setStatus("Configuracion guardada. Vuelve al editor para ver cambios.", "ok");
});

btnAdd.addEventListener("click", () => {
  tileDefs = readRows();
  const nextId = tileDefs.length ? Math.max(...tileDefs.map((item) => item.id)) + 1 : 0;
  tileDefs.push({
    id: nextId,
    name: `Tile ${nextId}`,
    color: "#9aa7b8",
    tx: 0,
    ty: 0,
    solid: true,
    slippery: false,
    breakable: false,
    animated: false,
    animationMs: 170,
    animationFrames: [{ tx: 0, ty: 0 }],
    locked: false
  });
  renderRows();
  setStatus(`Tile ${nextId} agregado.`, "ok");
});

btnReset.addEventListener("click", () => {
  localStorage.removeItem(TILE_DEFS_STORAGE_KEY);
  tileDefs = cloneDefaults();
  renderRows();
  setStatus("Se restauraron los tiles por defecto.", "warn");
});

function renderRows() {
  tilesBody.innerHTML = "";
  tileDefs
    .sort((a, b) => a.id - b.id)
    .forEach((tile) => {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.textContent = String(tile.id);

      const tdPreview = document.createElement("td");
      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = 32;
      previewCanvas.height = 32;
      previewCanvas.setAttribute("data-preview-id", String(tile.id));
      previewCanvas.style.width = "44px";
      previewCanvas.style.height = "44px";
      previewCanvas.style.border = "1px solid rgba(255,255,255,0.25)";
      previewCanvas.style.borderRadius = "6px";
      previewCanvas.style.background = "rgba(0,0,0,0.2)";
      drawTilePreview(previewCanvas, tile);
      tdPreview.appendChild(previewCanvas);

      const tdName = document.createElement("td");
      const inputName = document.createElement("input");
      inputName.type = "text";
      inputName.value = tile.name;
      inputName.setAttribute("data-field", "name");
      inputName.setAttribute("data-id", String(tile.id));
      tdName.appendChild(inputName);

      const tdColor = document.createElement("td");
      const inputColor = document.createElement("input");
      inputColor.type = "color";
      inputColor.value = normalizeHex(tile.color, "#7ebc56");
      inputColor.setAttribute("data-field", "color");
      inputColor.setAttribute("data-id", String(tile.id));
      inputColor.addEventListener("input", () => updatePreviewRow(tile.id));
      tdColor.appendChild(inputColor);

      const tdTx = document.createElement("td");
      const inputTx = document.createElement("input");
      inputTx.type = "number";
      inputTx.step = "1";
      inputTx.min = "0";
      inputTx.value = String(Number.isInteger(tile.tx) ? tile.tx : 0);
      inputTx.setAttribute("data-field", "tx");
      inputTx.setAttribute("data-id", String(tile.id));
      inputTx.addEventListener("input", () => updatePreviewRow(tile.id));
      inputTx.addEventListener("change", () => updatePreviewRow(tile.id));
      tdTx.appendChild(inputTx);

      const tdTy = document.createElement("td");
      const inputTy = document.createElement("input");
      inputTy.type = "number";
      inputTy.step = "1";
      inputTy.min = "0";
      inputTy.value = String(Number.isInteger(tile.ty) ? tile.ty : 0);
      inputTy.setAttribute("data-field", "ty");
      inputTy.setAttribute("data-id", String(tile.id));
      inputTy.addEventListener("input", () => updatePreviewRow(tile.id));
      inputTy.addEventListener("change", () => updatePreviewRow(tile.id));
      tdTy.appendChild(inputTy);

      const tdAnimated = document.createElement("td");
      const animatedCheckbox = makeCheckbox(tile.id, "animated", tile.animated);
      animatedCheckbox.addEventListener("change", () => {
        updateAnimationFieldState(tile.id);
        updatePreviewRow(tile.id);
      });
      tdAnimated.appendChild(animatedCheckbox);

      const tdAnimationMs = document.createElement("td");
      const inputAnimationMs = document.createElement("input");
      inputAnimationMs.type = "number";
      inputAnimationMs.step = "1";
      inputAnimationMs.min = "60";
      inputAnimationMs.value = String(normalizeAnimationMs(tile.animationMs, 170));
      inputAnimationMs.setAttribute("data-field", "animationMs");
      inputAnimationMs.setAttribute("data-id", String(tile.id));
      tdAnimationMs.appendChild(inputAnimationMs);

      const tdAnimationFrames = document.createElement("td");
      const inputAnimationFrames = document.createElement("input");
      inputAnimationFrames.type = "text";
      inputAnimationFrames.placeholder = "4,0 | 5,0 | 6,0";
      inputAnimationFrames.value = formatAnimationFrames(tile.animationFrames, tile.tx, tile.ty);
      inputAnimationFrames.setAttribute("data-field", "animationFrames");
      inputAnimationFrames.setAttribute("data-id", String(tile.id));
      inputAnimationFrames.addEventListener("input", () => updatePreviewRow(tile.id));
      tdAnimationFrames.appendChild(inputAnimationFrames);

      const tdSolid = document.createElement("td");
      const solidCheckbox = makeCheckbox(tile.id, "solid", tile.solid);
      solidCheckbox.addEventListener("change", () => updatePreviewRow(tile.id));
      tdSolid.appendChild(solidCheckbox);

      const tdSlip = document.createElement("td");
      tdSlip.appendChild(makeCheckbox(tile.id, "slippery", tile.slippery));

      const tdBreak = document.createElement("td");
      tdBreak.appendChild(makeCheckbox(tile.id, "breakable", tile.breakable));

      const tdActions = document.createElement("td");
      if (!tile.locked) {
        const btnDelete = document.createElement("button");
        btnDelete.type = "button";
        btnDelete.textContent = "Eliminar";
        btnDelete.addEventListener("click", () => {
          tileDefs = readRows().filter((item) => item.id !== tile.id);
          renderRows();
          setStatus(`Tile ${tile.id} eliminado.`, "warn");
        });
        tdActions.appendChild(btnDelete);
      } else {
        tdActions.textContent = "Base";
      }

      tr.appendChild(tdId);
      tr.appendChild(tdPreview);
      tr.appendChild(tdName);
      tr.appendChild(tdColor);
      tr.appendChild(tdTx);
      tr.appendChild(tdTy);
      tr.appendChild(tdAnimated);
      tr.appendChild(tdAnimationMs);
      tr.appendChild(tdAnimationFrames);
      tr.appendChild(tdSolid);
      tr.appendChild(tdSlip);
      tr.appendChild(tdBreak);
      tr.appendChild(tdActions);
      tilesBody.appendChild(tr);

      updateAnimationFieldState(tile.id);
    });
}

function makeCheckbox(id, field, checked) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.setAttribute("data-field", field);
  input.setAttribute("data-id", String(id));
  return input;
}

function readRows() {
  const rows = Array.from(tilesBody.querySelectorAll("tr"));
  const list = rows.map((row) => {
    const idText = row.children[0]?.textContent || "";
    const id = Number(idText);
    const base = DEFAULT_TILE_DEFS.find((item) => item.id === id);
    const nameEl = row.querySelector(`input[data-field="name"][data-id="${id}"]`);
    const colorEl = row.querySelector(`input[data-field="color"][data-id="${id}"]`);
    const txEl = row.querySelector(`input[data-field="tx"][data-id="${id}"]`);
    const tyEl = row.querySelector(`input[data-field="ty"][data-id="${id}"]`);
    const solidEl = row.querySelector(`input[data-field="solid"][data-id="${id}"]`);
    const slipEl = row.querySelector(`input[data-field="slippery"][data-id="${id}"]`);
    const breakEl = row.querySelector(`input[data-field="breakable"][data-id="${id}"]`);
    const animatedEl = row.querySelector(`input[data-field="animated"][data-id="${id}"]`);
    const animationMsEl = row.querySelector(`input[data-field="animationMs"][data-id="${id}"]`);
    const animationFramesEl = row.querySelector(`input[data-field="animationFrames"][data-id="${id}"]`);
    const tx = normalizeInt(txEl?.value, base?.tx ?? 0);
    const ty = normalizeInt(tyEl?.value, base?.ty ?? 0);
    const animated = Boolean(animatedEl?.checked);
    const animationFrames = parseAnimationFramesInput(animationFramesEl?.value, tx, ty);

    return {
      id,
      name: (nameEl?.value || "").trim() || base?.name || `Tile ${id}`,
      color: normalizeHex(colorEl?.value, base?.color || "#7ebc56"),
      tx,
      ty,
      solid: Boolean(solidEl?.checked),
      slippery: Boolean(slipEl?.checked),
      breakable: Boolean(breakEl?.checked),
      animated,
      animationMs: normalizeAnimationMs(animationMsEl?.value, base?.animationMs ?? 170),
      animationFrames,
      locked: Boolean(base?.locked)
    };
  });

  return list
    .filter((item) => Number.isInteger(item.id) && item.id >= 0)
    .sort((a, b) => a.id - b.id);
}

function updatePreviewRow(id) {
  const preview = tilesBody.querySelector(`canvas[data-preview-id="${id}"]`);
  if (!preview) {
    return;
  }

  const colorEl = tilesBody.querySelector(`input[data-field="color"][data-id="${id}"]`);
  const txEl = tilesBody.querySelector(`input[data-field="tx"][data-id="${id}"]`);
  const tyEl = tilesBody.querySelector(`input[data-field="ty"][data-id="${id}"]`);
  const solidEl = tilesBody.querySelector(`input[data-field="solid"][data-id="${id}"]`);
  const animatedEl = tilesBody.querySelector(`input[data-field="animated"][data-id="${id}"]`);
  const animationFramesEl = tilesBody.querySelector(`input[data-field="animationFrames"][data-id="${id}"]`);
  const base = DEFAULT_TILE_DEFS.find((item) => item.id === id);
  const tx = normalizeInt(txEl?.value, base?.tx ?? 0);
  const ty = normalizeInt(tyEl?.value, base?.ty ?? 0);
  const animated = Boolean(animatedEl?.checked);
  const frames = parseAnimationFramesInput(animationFramesEl?.value, tx, ty);
  const previewFrame = animated && frames.length ? frames[0] : { tx, ty };
  const tile = {
    id,
    color: normalizeHex(colorEl?.value, base?.color || "#7ebc56"),
    tx: previewFrame.tx,
    ty: previewFrame.ty,
    solid: Boolean(solidEl?.checked)
  };
  drawTilePreview(preview, tile);
}

function updateAnimationFieldState(id) {
  const animatedEl = tilesBody.querySelector(`input[data-field="animated"][data-id="${id}"]`);
  const animationMsEl = tilesBody.querySelector(`input[data-field="animationMs"][data-id="${id}"]`);
  const animationFramesEl = tilesBody.querySelector(`input[data-field="animationFrames"][data-id="${id}"]`);
  const enabled = Boolean(animatedEl?.checked);
  if (animationMsEl) {
    animationMsEl.disabled = !enabled;
  }
  if (animationFramesEl) {
    animationFramesEl.disabled = !enabled;
  }
}

function loadTileDefs() {
  try {
    const raw = localStorage.getItem(TILE_DEFS_STORAGE_KEY);
    if (!raw) {
      return cloneDefaults();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return cloneDefaults();
    }

    const merged = [...parsed]
      .map((entry) => {
        const id = Math.round(Number(entry?.id));
        if (!Number.isInteger(id) || id < 0) {
          return null;
        }
        const base = DEFAULT_TILE_DEFS.find((item) => item.id === id);
        return {
          id,
          name: typeof entry?.name === "string" && entry.name.trim() ? entry.name.trim() : (base?.name || `Tile ${id}`),
          color: normalizeHex(entry?.color, base?.color || "#7ebc56"),
          tx: normalizeInt(entry?.tx, base?.tx ?? 0),
          ty: normalizeInt(entry?.ty, base?.ty ?? 0),
          solid: typeof entry?.solid === "boolean" ? entry.solid : Boolean(base?.solid),
          slippery: typeof entry?.slippery === "boolean" ? entry.slippery : Boolean(base?.slippery),
          breakable: typeof entry?.breakable === "boolean" ? entry.breakable : Boolean(base?.breakable),
          animated: typeof entry?.animated === "boolean" ? entry.animated : Boolean(base?.animated),
          animationMs: Math.max(60, Math.round(Number(entry?.animationMs) || Number(base?.animationMs) || 170)),
          animationFrames: Array.isArray(entry?.animationFrames)
            ? entry.animationFrames
              .map((frame) => ({
                tx: normalizeInt(frame?.tx, base?.tx ?? 0),
                ty: normalizeInt(frame?.ty, base?.ty ?? 0)
              }))
              .filter((frame) => Number.isInteger(frame.tx) && Number.isInteger(frame.ty))
            : Array.isArray(base?.animationFrames)
              ? base.animationFrames.map((frame) => ({ ...frame }))
              : null,
          locked: Boolean(base?.locked)
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.id - b.id);

    if (!merged.length) {
      return cloneDefaults();
    }

    const existingIds = new Set(merged.map((item) => item.id));
    DEFAULT_TILE_DEFS.forEach((base) => {
      if (!existingIds.has(base.id)) {
        merged.push({ ...base });
      }
    });

    return merged.sort((a, b) => a.id - b.id);
  } catch {
    return cloneDefaults();
  }
}

function cloneDefaults() {
  return DEFAULT_TILE_DEFS.map((item) => ({ ...item }));
}

function normalizeHex(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const raw = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback;
}

function normalizeInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(0, Math.round(num));
}

function normalizeAnimationMs(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return Math.max(60, Math.round(Number(fallback) || 170));
  }
  return Math.max(60, Math.round(num));
}

function formatAnimationFrames(frames, fallbackTx, fallbackTy) {
  if (!Array.isArray(frames) || !frames.length) {
    return `${normalizeInt(fallbackTx, 0)},${normalizeInt(fallbackTy, 0)}`;
  }
  return frames
    .map((frame) => `${normalizeInt(frame?.tx, fallbackTx ?? 0)},${normalizeInt(frame?.ty, fallbackTy ?? 0)}`)
    .join(" | ");
}

function parseAnimationFramesInput(value, fallbackTx, fallbackTy) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return [{ tx: normalizeInt(fallbackTx, 0), ty: normalizeInt(fallbackTy, 0) }];
  }

  const parsed = raw
    .split("|")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const parts = chunk.split(",").map((part) => part.trim());
      if (parts.length < 2) {
        return null;
      }
      const tx = normalizeInt(parts[0], NaN);
      const ty = normalizeInt(parts[1], NaN);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) {
        return null;
      }
      return { tx, ty };
    })
    .filter((frame) => frame !== null);

  if (!parsed.length) {
    return [{ tx: normalizeInt(fallbackTx, 0), ty: normalizeInt(fallbackTy, 0) }];
  }
  return parsed;
}

function loadAtlasImage() {
  atlasImage = new Image();
  atlasImage.onload = () => renderRows();
  atlasImage.src = TILE_ATLAS_SRC;
}

function drawTilePreview(canvas, tile) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const tx = Number.isInteger(tile.tx) ? tile.tx : 0;
  const ty = Number.isInteger(tile.ty) ? tile.ty : 0;

  if (atlasImage && atlasImage.complete && atlasImage.naturalWidth > 0) {
    const sx = tx * TILE_SIZE;
    const sy = ty * TILE_SIZE;
    const valid = sx >= 0 && sy >= 0 && sx + TILE_SIZE <= atlasImage.naturalWidth && sy + TILE_SIZE <= atlasImage.naturalHeight;
    if (valid) {
      ctx.globalAlpha = tile.solid ? 1 : 0.65;
      ctx.drawImage(atlasImage, sx, sy, TILE_SIZE, TILE_SIZE, 0, 0, 32, 32);
      ctx.globalAlpha = 1;
      return;
    }
  }

  ctx.fillStyle = normalizeHex(tile.color, "#7ebc56");
  ctx.globalAlpha = tile.solid ? 1 : 0.55;
  ctx.fillRect(0, 0, 32, 32);
  ctx.globalAlpha = 1;
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "warn");
  statusEl.classList.add(type || "ok");
}
