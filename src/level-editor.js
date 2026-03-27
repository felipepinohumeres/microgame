const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 17;
const IS_TOUCH_DEVICE = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const TILE_SIZE = IS_TOUCH_DEVICE ? 24 : 16;
const WORLD_TILE_SIZE = 32;

const STORAGE_KEY = "microgame_level_v1";
const LEVELS_STORAGE_KEY = "microgame_levels_v1";
const ACTIVE_LEVEL_ID_KEY = "microgame_level_active_id";

const MIN_COLS = 20;
const MAX_COLS = 300;
const MIN_ROWS = 8;
const MAX_ROWS = 80;

const DEFAULT_PLAYER_SPAWN = { x: 96, y: 364 };
const DEFAULT_ENEMY_SPAWNS = [720, 1280, 1640, 2100, 2550, 3050, 3460];
const DEFAULT_FLYING_SPAWNS = [
  { x: 980, y: 180 },
  { x: 1760, y: 160 },
  { x: 2460, y: 200 },
  { x: 3260, y: 170 }
];
const DEFAULT_CHARGER_SPAWNS = [1420, 2320, 3380];
const DEFAULT_TURRET_SPAWNS = [1160, 2010, 2870];
const DEFAULT_BOMBER_SPAWNS = [
  { x: 1540, y: 150 },
  { x: 2740, y: 170 },
  { x: 3560, y: 150 }
];

const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");
const jsonArea = document.getElementById("jsonArea");
const statusEl = document.getElementById("status");

const levelSelect = document.getElementById("levelSelect");
const inputCols = document.getElementById("inputCols");
const inputRows = document.getElementById("inputRows");
const inputLevelFile = document.getElementById("inputLevelFile");
const btnTouchMode = document.getElementById("btnTouchMode");
const floatingToolButtons = Array.from(document.querySelectorAll("[data-tool-float]"));

const tools = {
  paint: document.getElementById("toolPaint"),
  erase: document.getElementById("toolErase"),
  player: document.getElementById("toolPlayer"),
  enemy: document.getElementById("toolEnemy"),
  flying: document.getElementById("toolFlying"),
  charger: document.getElementById("toolCharger"),
  turret: document.getElementById("toolTurret"),
  bomber: document.getElementById("toolBomber"),
  eraseSpawn: document.getElementById("toolEraseSpawn")
};

let levelCols = DEFAULT_COLS;
let levelRows = DEFAULT_ROWS;
let tool = "paint";
let isPointerDown = false;
let activePointerId = null;
let touchDrawEnabled = false;
let grid = createEmptyGrid(levelCols, levelRows);
let levelEntities = getDefaultEntities();

let levelsState = loadLevelsState();
let currentLevelId = resolveCurrentLevelId(levelsState);

wireUI();
applyCurrentLevelFromCatalog();
refreshLevelSelect();
syncSizeInputs();
render();
setStatus("Editor listo.", "ok");
syncTouchModeUI();

function wireUI() {
  Object.entries(tools).forEach(([key, btn]) => {
    btn.addEventListener("click", () => setTool(key));
  });

  levelSelect.addEventListener("change", () => {
    saveCurrentIntoCatalog();
    currentLevelId = levelSelect.value;
    applyCurrentLevelFromCatalog();
    saveLevelsState();
    refreshLevelSelect();
    syncSizeInputs();
    render();
    setStatus("Nivel cambiado.", "ok");
  });

  document.getElementById("btnLevelNew").addEventListener("click", () => {
    saveCurrentIntoCatalog();
    const name = prompt("Nombre del nuevo nivel:", createNextLevelName());
    if (!name) {
      return;
    }
    const payload = getDefaultLevelPayload(levelCols, levelRows);
    const record = {
      id: createLevelId(),
      name: name.trim() || createNextLevelName(),
      payload
    };
    levelsState.levels.push(record);
    currentLevelId = record.id;
    applyCurrentLevelFromCatalog();
    saveLevelsState();
    refreshLevelSelect();
    syncSizeInputs();
    render();
    setStatus("Nivel creado.", "ok");
  });

  document.getElementById("btnLevelDuplicate").addEventListener("click", () => {
    const current = getCurrentRecord();
    if (!current) {
      return;
    }
    saveCurrentIntoCatalog();
    const record = {
      id: createLevelId(),
      name: `${current.name} (copia)`,
      payload: clonePayload(current.payload)
    };
    levelsState.levels.push(record);
    currentLevelId = record.id;
    applyCurrentLevelFromCatalog();
    saveLevelsState();
    refreshLevelSelect();
    syncSizeInputs();
    render();
    setStatus("Nivel duplicado.", "ok");
  });

  document.getElementById("btnLevelRename").addEventListener("click", () => {
    const current = getCurrentRecord();
    if (!current) {
      return;
    }
    const name = prompt("Nuevo nombre del nivel:", current.name);
    if (!name) {
      return;
    }
    current.name = name.trim() || current.name;
    saveLevelsState();
    refreshLevelSelect();
    setStatus("Nivel renombrado.", "ok");
  });

  document.getElementById("btnLevelDelete").addEventListener("click", () => {
    if (levelsState.levels.length <= 1) {
      setStatus("No podes borrar el unico nivel.", "warn");
      return;
    }
    const current = getCurrentRecord();
    if (!current) {
      return;
    }
    if (!confirm(`Eliminar nivel '${current.name}'?`)) {
      return;
    }

    levelsState.levels = levelsState.levels.filter((lvl) => lvl.id !== current.id);
    if (levelsState.activeId === current.id) {
      levelsState.activeId = levelsState.levels[0].id;
    }
    currentLevelId = levelsState.levels[0].id;
    applyCurrentLevelFromCatalog();
    saveLevelsState();
    refreshLevelSelect();
    syncSizeInputs();
    render();
    setStatus("Nivel eliminado.", "warn");
  });

  document.getElementById("btnLevelSetActive").addEventListener("click", () => {
    saveCurrentIntoCatalog();
    levelsState.activeId = currentLevelId;
    saveLevelsState();
    refreshLevelSelect();
    setStatus("Nivel activo actualizado para el juego.", "ok");
  });

  document.getElementById("btnResize").addEventListener("click", () => {
    const cols = clampNumber(Number(inputCols.value), MIN_COLS, MAX_COLS, levelCols);
    const rows = clampNumber(Number(inputRows.value), MIN_ROWS, MAX_ROWS, levelRows);
    resizeLevel(cols, rows);
    syncSizeInputs();
    render();
    setStatus(`Tamano actualizado a ${levelCols}x${levelRows}.`, "ok");
  });

  document.getElementById("btnLoadFile").addEventListener("click", async () => {
    const rawName = (inputLevelFile.value || "").trim();
    if (!rawName) {
      setStatus("Especifica el nombre base, por ejemplo: nivel-2", "warn");
      return;
    }

    const baseName = rawName.replace(/\.json$/i, "");
    const fileName = `${baseName}.json`;
    const safeName = fileName.replace(/^[/\\]+/, "");
    const url = `./levels/${safeName}`;

    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setStatus(`No se pudo cargar '${safeName}' (HTTP ${response.status}).`, "danger");
        return;
      }

      const rawJson = await response.text();
      const parsed = parseLevel(rawJson);
      if (!parsed) {
        setStatus(`El archivo '${safeName}' no tiene un formato de nivel valido.`, "danger");
        return;
      }

      applyParsedLevel(parsed);
      saveCurrentIntoCatalog();
      saveLevelsState();
      syncSizeInputs();
      render();
      setStatus(`Nivel cargado desde levels/${safeName}.`, "ok");
    } catch {
      setStatus("Error al cargar archivo. Usa servidor local (no abrir como file://).", "danger");
    }
  });

  document.getElementById("btnGenerate").addEventListener("click", () => {
    grid = buildDefaultGrid(levelCols, levelRows);
    levelEntities = getDefaultEntities(levelCols, levelRows);
    render();
    setStatus("Layout y spawns base generados.", "ok");
  });

  document.getElementById("btnClear").addEventListener("click", () => {
    grid = createEmptyGrid(levelCols, levelRows);
    levelEntities = {
      ...getDefaultEntities(levelCols, levelRows),
      enemySpawns: [],
      flyingSpawns: [],
      chargerSpawns: [],
      turretSpawns: [],
      bomberSpawns: []
    };
    render();
    setStatus("Nivel limpio.", "warn");
  });

  document.getElementById("btnSaveLocal").addEventListener("click", () => {
    saveCurrentIntoCatalog();
    saveLevelsState();
    refreshLevelSelect();
    setStatus("Nivel guardado en el catalogo local.", "ok");
  });

  document.getElementById("btnLoadLocal").addEventListener("click", () => {
    const parsed = parseLevel(localStorage.getItem(STORAGE_KEY));
    if (!parsed) {
      setStatus("No hay nivel activo valido en localStorage.", "warn");
      return;
    }
    applyParsedLevel(parsed);
    syncSizeInputs();
    render();
    setStatus("Nivel activo cargado desde localStorage.", "ok");
  });

  document.getElementById("btnExport").addEventListener("click", () => {
    jsonArea.value = JSON.stringify(toExportObject(), null, 2);
    setStatus("JSON exportado al panel.", "ok");
  });

  document.getElementById("btnCopy").addEventListener("click", async () => {
    jsonArea.value = JSON.stringify(toExportObject(), null, 2);
    try {
      await navigator.clipboard.writeText(jsonArea.value);
      setStatus("JSON copiado al portapapeles.", "ok");
    } catch {
      setStatus("No se pudo copiar (permiso del navegador).", "warn");
    }
  });

  document.getElementById("btnImport").addEventListener("click", () => {
    const parsed = parseLevel(jsonArea.value.trim());
    if (!parsed) {
      setStatus("JSON invalido o dimensiones incorrectas.", "danger");
      return;
    }
    applyParsedLevel(parsed);
    syncSizeInputs();
    render();
    setStatus("Nivel importado correctamente.", "ok");
  });

  document.getElementById("btnDownload").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(toExportObject(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName(getCurrentRecord()?.name || "level")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Archivo JSON descargado.", "ok");
  });

  if (btnTouchMode) {
    btnTouchMode.addEventListener("click", () => {
      touchDrawEnabled = !touchDrawEnabled;
      syncTouchModeUI();
      setStatus(
        touchDrawEnabled ? "Modo tactil: pintar." : "Modo tactil: navegar.",
        touchDrawEnabled ? "ok" : "warn"
      );
    });
  }

  floatingToolButtons.forEach((btn) => {
    const nextTool = btn.getAttribute("data-tool-float");
    if (!nextTool) {
      return;
    }
    btn.addEventListener("click", () => setTool(nextTool));
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }
    if (event.pointerType === "touch" && !touchDrawEnabled) {
      return;
    }
    event.preventDefault();
    activePointerId = event.pointerId;
    isPointerDown = true;
    canvas.setPointerCapture(event.pointerId);
    actAtPointer(event, false);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!isPointerDown || event.pointerId !== activePointerId) {
      return;
    }
    event.preventDefault();
    if (tool === "paint" || tool === "erase") {
      actAtPointer(event, false);
    }
  });

  const releasePointer = (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    isPointerDown = false;
    activePointerId = null;
  };

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    actAtPointer(event, true);
  });
}

function setTool(nextTool) {
  tool = nextTool;
  Object.entries(tools).forEach(([key, btn]) => {
    btn.classList.toggle("active", key === tool);
  });
  floatingToolButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tool-float") === tool);
  });
  setStatus(`Herramienta: ${tool}.`, "ok");
}

function syncTouchModeUI() {
  if (!btnTouchMode) {
    return;
  }
  btnTouchMode.textContent = touchDrawEnabled ? "Modo: Pintar" : "Modo: Navegar";
  document.body.classList.toggle("draw-mode", touchDrawEnabled);
  document.body.classList.toggle("nav-mode", !touchDrawEnabled);
}

function syncSizeInputs() {
  inputCols.value = String(levelCols);
  inputRows.value = String(levelRows);
}

function setCanvasSize() {
  canvas.width = levelCols * TILE_SIZE;
  canvas.height = levelRows * TILE_SIZE;
}

function resizeLevel(newCols, newRows) {
  if (newCols === levelCols && newRows === levelRows) {
    return;
  }

  const resized = Array.from({ length: newRows }, (_, y) => (
    Array.from({ length: newCols }, (_, x) => (y < levelRows && x < levelCols ? grid[y][x] : -1))
  ));

  levelCols = newCols;
  levelRows = newRows;
  grid = resized;

  const maxX = levelCols * WORLD_TILE_SIZE;
  const maxY = levelRows * WORLD_TILE_SIZE;

  levelEntities.playerSpawn = clampPoint(levelEntities.playerSpawn, DEFAULT_PLAYER_SPAWN, maxX, maxY);
  levelEntities.enemySpawns = levelEntities.enemySpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.chargerSpawns = levelEntities.chargerSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.turretSpawns = levelEntities.turretSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.flyingSpawns = levelEntities.flyingSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.bomberSpawns = levelEntities.bomberSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);

  setCanvasSize();
}

function actAtPointer(event, forceErase) {
  const pos = getPointerWorld(event);
  if (!pos) {
    return;
  }

  if (tool === "paint" || tool === "erase") {
    const value = forceErase || tool === "erase" ? -1 : 0;
    grid[pos.gridY][pos.gridX] = value;
    render();
    return;
  }

  if (forceErase || tool === "eraseSpawn") {
    eraseNearestSpawn(pos.worldX, pos.worldY);
    render();
    return;
  }

  placeSpawnForTool(tool, pos.worldX, pos.worldY);
  render();
}

function getPointerWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (event.clientX - rect.left) * scaleX;
  const py = (event.clientY - rect.top) * scaleY;
  const gx = Math.floor(px / TILE_SIZE);
  const gy = Math.floor(py / TILE_SIZE);
  if (gx < 0 || gx >= levelCols || gy < 0 || gy >= levelRows) {
    return null;
  }
  return {
    gridX: gx,
    gridY: gy,
    worldX: gx * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2,
    worldY: gy * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2
  };
}

function placeSpawnForTool(currentTool, x, y) {
  if (currentTool === "player") {
    levelEntities.playerSpawn = { x, y };
    return;
  }
  if (currentTool === "enemy") {
    pushUniquePoint(levelEntities.enemySpawns, x, y);
    return;
  }
  if (currentTool === "charger") {
    pushUniquePoint(levelEntities.chargerSpawns, x, y);
    return;
  }
  if (currentTool === "turret") {
    pushUniquePoint(levelEntities.turretSpawns, x, y);
    return;
  }
  if (currentTool === "flying") {
    levelEntities.flyingSpawns.push({ x, y });
    return;
  }
  if (currentTool === "bomber") {
    levelEntities.bomberSpawns.push({ x, y });
  }
}

function eraseNearestSpawn(x, y) {
  const candidates = [];
  candidates.push({ type: "playerSpawn", index: -1, x: levelEntities.playerSpawn.x, y: levelEntities.playerSpawn.y });

  levelEntities.enemySpawns.forEach((s, i) => candidates.push({ type: "enemySpawns", index: i, x: s.x, y: s.y }));
  levelEntities.chargerSpawns.forEach((s, i) => candidates.push({ type: "chargerSpawns", index: i, x: s.x, y: s.y }));
  levelEntities.turretSpawns.forEach((s, i) => candidates.push({ type: "turretSpawns", index: i, x: s.x, y: s.y }));
  levelEntities.flyingSpawns.forEach((s, i) => candidates.push({ type: "flyingSpawns", index: i, x: s.x, y: s.y }));
  levelEntities.bomberSpawns.forEach((s, i) => candidates.push({ type: "bomberSpawns", index: i, x: s.x, y: s.y }));

  let best = null;
  let bestDist = Infinity;

  for (const c of candidates) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }

  if (!best || bestDist > 64) {
    return;
  }

  if (best.type === "playerSpawn") {
    levelEntities.playerSpawn = { ...DEFAULT_PLAYER_SPAWN };
    return;
  }

  levelEntities[best.type].splice(best.index, 1);
}

function pushUniquePoint(list, x, y) {
  const exists = list.some((value) => Math.hypot(value.x - x, value.y - y) < 20);
  if (!exists) {
    list.push({ x, y });
  }
}

function render() {
  drawGrid();
  drawSpawns();
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < levelRows; y += 1) {
    for (let x = 0; x < levelCols; x += 1) {
      ctx.fillStyle = grid[y][x] === 0 ? "#7ebc56" : "#1f3558";
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  for (let x = 0; x <= levelCols; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * TILE_SIZE + 0.5, 0);
    ctx.lineTo(x * TILE_SIZE + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= levelRows; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE_SIZE + 0.5);
    ctx.lineTo(canvas.width, y * TILE_SIZE + 0.5);
    ctx.stroke();
  }
}

function drawSpawns() {
  drawMarker(levelEntities.playerSpawn.x, levelEntities.playerSpawn.y, "#4aa3ff", "P");
  levelEntities.enemySpawns.forEach((s) => drawMarker(s.x, s.y, "#ff6d4a", "E"));
  levelEntities.flyingSpawns.forEach((s) => drawMarker(s.x, s.y, "#8be1ff", "F"));
  levelEntities.chargerSpawns.forEach((s) => drawMarker(s.x, s.y, "#ffb36b", "C"));
  levelEntities.turretSpawns.forEach((s) => drawMarker(s.x, s.y, "#b6ff91", "T"));
  levelEntities.bomberSpawns.forEach((s) => drawMarker(s.x, s.y, "#d6a9ff", "B"));
}

function drawMarker(worldX, worldY, color, label) {
  const x = (worldX / WORLD_TILE_SIZE) * TILE_SIZE;
  const y = (worldY / WORLD_TILE_SIZE) * TILE_SIZE;

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 1.5;
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "bold 10px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - 8);
}

function loadLevelsState() {
  const fallbackPayload = parseLevel(localStorage.getItem(STORAGE_KEY)) || parseLevel(getDefaultLevelPayload(DEFAULT_COLS, DEFAULT_ROWS));
  const fallback = {
    levels: [{ id: "level_1", name: "Nivel 1", payload: fallbackPayload }],
    activeId: "level_1"
  };

  try {
    const raw = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.levels) || !parsed.levels.length) {
      return fallback;
    }

    const levels = parsed.levels
      .map((lvl, idx) => {
        const payload = parseLevel(lvl.payload);
        if (!payload) {
          return null;
        }
        return {
          id: lvl.id || `level_${idx + 1}`,
          name: lvl.name || `Nivel ${idx + 1}`,
          payload
        };
      })
      .filter((lvl) => lvl !== null);

    if (!levels.length) {
      return fallback;
    }

    const activeId = levels.some((lvl) => lvl.id === parsed.activeId) ? parsed.activeId : levels[0].id;
    return { levels, activeId };
  } catch {
    return fallback;
  }
}

function saveLevelsState() {
  localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(levelsState));
  localStorage.setItem(ACTIVE_LEVEL_ID_KEY, levelsState.activeId);

  const active = levelsState.levels.find((lvl) => lvl.id === levelsState.activeId) || levelsState.levels[0];
  if (active) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active.payload));
  }
}

function resolveCurrentLevelId(state) {
  const preferred = localStorage.getItem(ACTIVE_LEVEL_ID_KEY);
  if (preferred && state.levels.some((lvl) => lvl.id === preferred)) {
    return preferred;
  }
  return state.activeId && state.levels.some((lvl) => lvl.id === state.activeId)
    ? state.activeId
    : state.levels[0].id;
}

function getCurrentRecord() {
  return levelsState.levels.find((lvl) => lvl.id === currentLevelId) || null;
}

function applyCurrentLevelFromCatalog() {
  const current = getCurrentRecord();
  if (!current) {
    applyParsedLevel(parseLevel(getDefaultLevelPayload(DEFAULT_COLS, DEFAULT_ROWS)));
    return;
  }
  applyParsedLevel(parseLevel(current.payload) || parseLevel(getDefaultLevelPayload(DEFAULT_COLS, DEFAULT_ROWS)));
}

function saveCurrentIntoCatalog() {
  const current = getCurrentRecord();
  if (!current) {
    return;
  }
  current.payload = clonePayload(toExportObject());
}

function refreshLevelSelect() {
  levelSelect.innerHTML = "";
  levelsState.levels.forEach((lvl) => {
    const option = document.createElement("option");
    option.value = lvl.id;
    option.selected = lvl.id === currentLevelId;
    option.textContent = lvl.id === levelsState.activeId ? `${lvl.name} [activo]` : lvl.name;
    levelSelect.appendChild(option);
  });
}

function createLevelId() {
  return `level_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function createNextLevelName() {
  let i = 1;
  const names = new Set(levelsState.levels.map((lvl) => lvl.name));
  while (names.has(`Nivel ${i}`)) {
    i += 1;
  }
  return `Nivel ${i}`;
}

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9_-]+/gi, "-");
}

function clonePayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

function createEmptyGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(-1));
}

function buildDefaultGrid(cols, rows) {
  const rowsData = createEmptyGrid(cols, rows);
  const floorRow = rows - 1;
  for (let x = 0; x < cols; x += 1) {
    rowsData[floorRow][x] = 0;
  }

  addPlatformSafe(rowsData, floorRow - 3, 6, 14);
  addPlatformSafe(rowsData, floorRow - 4, 18, 23);
  addPlatformSafe(rowsData, floorRow - 5, 28, 36);
  addPlatformSafe(rowsData, floorRow - 7, 40, 46);
  addPlatformSafe(rowsData, floorRow - 3, 50, 58);
  addPlatformSafe(rowsData, floorRow - 6, 62, 67);
  addPlatformSafe(rowsData, floorRow - 8, 73, 78);
  addPlatformSafe(rowsData, floorRow - 4, 82, 88);
  addPlatformSafe(rowsData, floorRow - 7, 92, 97);
  addPlatformSafe(rowsData, floorRow - 5, 102, 109);

  addColumnSafe(rowsData, 15, floorRow - 1, 2);
  addColumnSafe(rowsData, 33, floorRow - 2, 3);
  addColumnSafe(rowsData, 56, floorRow - 1, 2);
  addColumnSafe(rowsData, 84, floorRow - 2, 3);

  return rowsData;
}

function addPlatformSafe(rowsData, row, startX, endX) {
  if (row < 0 || row >= rowsData.length) {
    return;
  }
  const maxX = rowsData[0].length - 1;
  const from = Math.max(0, startX);
  const to = Math.min(maxX, endX);
  for (let x = from; x <= to; x += 1) {
    rowsData[row][x] = 0;
  }
}

function addColumnSafe(rowsData, x, startRow, height) {
  if (x < 0 || x >= rowsData[0].length) {
    return;
  }
  for (let i = 0; i < height; i += 1) {
    const row = startRow - i;
    if (row >= 0 && row < rowsData.length) {
      rowsData[row][x] = 0;
    }
  }
}

function getDefaultEntities(cols, rows) {
  const maxX = cols * WORLD_TILE_SIZE;
  const maxY = rows * WORLD_TILE_SIZE;
  return {
    playerSpawn: clampPoint(DEFAULT_PLAYER_SPAWN, DEFAULT_PLAYER_SPAWN, maxX, maxY),
    enemySpawns: DEFAULT_ENEMY_SPAWNS.filter((x) => x >= 0 && x <= maxX).map((x) => ({ x, y: 60 })),
    flyingSpawns: DEFAULT_FLYING_SPAWNS.filter((s) => s.x >= 0 && s.x <= maxX && s.y >= 0 && s.y <= maxY).map((s) => ({ ...s })),
    chargerSpawns: DEFAULT_CHARGER_SPAWNS.filter((x) => x >= 0 && x <= maxX).map((x) => ({ x, y: 60 })),
    turretSpawns: DEFAULT_TURRET_SPAWNS.filter((x) => x >= 0 && x <= maxX).map((x) => ({ x, y: 60 })),
    bomberSpawns: DEFAULT_BOMBER_SPAWNS.filter((s) => s.x >= 0 && s.x <= maxX && s.y >= 0 && s.y <= maxY).map((s) => ({ ...s }))
  };
}

function getDefaultLevelPayload(cols, rows) {
  return {
    cols,
    rows,
    tileSize: WORLD_TILE_SIZE,
    data: buildDefaultGrid(cols, rows),
    ...getDefaultEntities(cols, rows)
  };
}

function toExportObject() {
  return {
    cols: levelCols,
    rows: levelRows,
    tileSize: WORLD_TILE_SIZE,
    data: grid,
    ...levelEntities
  };
}

function parseLevel(raw) {
  if (!raw) {
    return null;
  }

  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const data = Array.isArray(obj) ? obj : obj.data;
    if (!Array.isArray(data) || !data.length || !Array.isArray(data[0])) {
      return null;
    }

    const rows = clampNumber(Number(obj.rows || data.length), MIN_ROWS, MAX_ROWS, data.length);
    const cols = clampNumber(Number(obj.cols || data[0].length), MIN_COLS, MAX_COLS, data[0].length);

    if (data.length !== rows) {
      return null;
    }

    const normalizedGrid = data.map((row) => {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("invalid row");
      }
      return row.map((cell) => (cell === 0 ? 0 : -1));
    });

    const maxX = cols * WORLD_TILE_SIZE;
    const maxY = rows * WORLD_TILE_SIZE;
    const defaults = getDefaultEntities(cols, rows);

    return {
      cols,
      rows,
      data: normalizedGrid,
      playerSpawn: clampPoint(obj.playerSpawn, defaults.playerSpawn, maxX, maxY),
      enemySpawns: normalizeSpawnArray(obj.enemySpawns, defaults.enemySpawns, maxX, maxY, 60),
      flyingSpawns: normalizePointArray(obj.flyingSpawns, defaults.flyingSpawns, maxX, maxY),
      chargerSpawns: normalizeSpawnArray(obj.chargerSpawns, defaults.chargerSpawns, maxX, maxY, 60),
      turretSpawns: normalizeSpawnArray(obj.turretSpawns, defaults.turretSpawns, maxX, maxY, 60),
      bomberSpawns: normalizePointArray(obj.bomberSpawns, defaults.bomberSpawns, maxX, maxY)
    };
  } catch {
    return null;
  }
}

function applyParsedLevel(parsed) {
  levelCols = parsed.cols;
  levelRows = parsed.rows;
  grid = parsed.data;
  levelEntities = {
    playerSpawn: parsed.playerSpawn,
    enemySpawns: parsed.enemySpawns,
    flyingSpawns: parsed.flyingSpawns,
    chargerSpawns: parsed.chargerSpawns,
    turretSpawns: parsed.turretSpawns,
    bomberSpawns: parsed.bomberSpawns
  };
  setCanvasSize();
}

function normalizeXArray(value, fallback, maxX) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  return value
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= maxX);
}

function normalizeSpawnArray(value, fallback, maxX, maxY, defaultY) {
  if (!Array.isArray(value)) {
    return fallback.map((p) => ({ ...p }));
  }

  return value
    .map((item) => {
      if (typeof item === "number") {
        const x = Number(item);
        if (!Number.isFinite(x) || x < 0 || x > maxX) {
          return null;
        }
        return { x, y: defaultY };
      }
      return clampPoint(item, null, maxX, maxY);
    })
    .filter((p) => p !== null);
}

function normalizePointArray(value, fallback, maxX, maxY) {
  if (!Array.isArray(value)) {
    return fallback.map((p) => ({ ...p }));
  }
  return value
    .map((p) => clampPoint(p, null, maxX, maxY))
    .filter((p) => p !== null);
}

function clampPoint(value, fallback, maxX, maxY) {
  if (!value || typeof value !== "object") {
    return fallback ? { ...fallback } : null;
  }
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > maxX || y < 0 || y > maxY) {
    return fallback ? { ...fallback } : null;
  }
  return { x, y };
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "warn", "danger");
  statusEl.classList.add(type || "ok");
}
