const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 17;
const IS_TOUCH_DEVICE = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const TILE_SIZE = IS_TOUCH_DEVICE ? 24 : 44;
const WORLD_TILE_SIZE = 32;

const STORAGE_KEY = "microgame_level_v1";
const LEVELS_STORAGE_KEY = "microgame_levels_v1";
const ACTIVE_LEVEL_ID_KEY = "microgame_level_active_id";
const TILE_DEFS_STORAGE_KEY = "microgame_tile_defs_v1";
const ASSET_EXTENSIONS = [".png", ".svg", ".webp", ".jpg", ".jpeg"];
const MUSIC_EXTENSIONS = [".ogg", ".mp3", ".wav", ".m4a"];
const AVAILABLE_MUSIC_FILES = [
  "./music/4.2-Light-Years.ogg",
  "./music/Alley-Chase_v001_Looping.ogg",
  "./music/Arcade-Goblins.ogg",
  "./music/Bouncy-Platformer.ogg",
  "./music/Cyber-City-of-Light_Looping.ogg",
  "./music/Cyberpunk-Outlaws_Looping.ogg",
  "./music/Enemy-Infiltration.ogg",
  "./music/Future-Noir.ogg",
  "./music/Invasion_Looping.ogg",
  "./music/Lost-and-Faltering_Looping.ogg",
  "./music/Pixel-Quirk.ogg",
  "./music/Wild-Ride-Through-Tokyo.ogg"
];

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
const tileLegendEl = document.getElementById("tileLegend");

const levelSelect = document.getElementById("levelSelect");
const inputCols = document.getElementById("inputCols");
const inputRows = document.getElementById("inputRows");
const paintTileTypeSelect = document.getElementById("paintTileType");
const inputParallaxAnchor = document.getElementById("inputParallaxAnchor");
const inputParallaxSky = document.getElementById("inputParallaxSky");
const inputParallaxFar = document.getElementById("inputParallaxFar");
const inputParallaxMid = document.getElementById("inputParallaxMid");
const btnParallaxFilesApply = document.getElementById("btnParallaxFilesApply");
const inputBgmFile = document.getElementById("inputBgmFile");
const inputBgmSelect = document.getElementById("inputBgmSelect");
const btnBgmApply = document.getElementById("btnBgmApply");
const inputLevelFile = document.getElementById("inputLevelFile");
const inputDecorImage = document.getElementById("inputDecorImage");
const inputDecorX = document.getElementById("inputDecorX");
const inputDecorY = document.getElementById("inputDecorY");
const inputDecorScale = document.getElementById("inputDecorScale");
const inputDecorAlpha = document.getElementById("inputDecorAlpha");
const inputDecorDepth = document.getElementById("inputDecorDepth");
const btnDecorApply = document.getElementById("btnDecorApply");
const btnDecorClear = document.getElementById("btnDecorClear");
const btnTouchMode = document.getElementById("btnTouchMode");
const floatingToolButtons = Array.from(document.querySelectorAll("[data-tool-float]"));

const tools = {
  paint: document.getElementById("toolPaint"),
  erase: document.getElementById("toolErase"),
  player: document.getElementById("toolPlayer"),
  entryLeft: document.getElementById("toolEntryLeft"),
  entryRight: document.getElementById("toolEntryRight"),
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
let paintTileType = 0;
let grid = createEmptyGrid(levelCols, levelRows);
let levelEntities = getDefaultEntities();
let levelParallaxAnchor = "top";
let levelParallaxFiles = getDefaultParallaxFiles();
let levelBgmFile = getDefaultBgmFile();
let levelDecorLayer = null;
let tileDefinitions = loadTileDefinitions();

let levelsState = loadLevelsState();
let currentLevelId = resolveCurrentLevelId(levelsState);

wireUI();
syncTileDefinitionsUI();
syncBgmSelect();
applyCurrentLevelFromCatalog();
refreshLevelSelect();
syncSizeInputs();
render();
setStatus("Editor listo.", "ok");
syncTouchModeUI();
window.addEventListener("focus", () => {
  tileDefinitions = loadTileDefinitions();
  syncTileDefinitionsUI();
  render();
});

function wireUI() {
  Object.entries(tools).forEach(([key, btn]) => {
    btn.addEventListener("click", () => setTool(key));
  });

  if (paintTileTypeSelect) {
    paintTileTypeSelect.addEventListener("change", () => {
      const nextType = normalizeTileValue(Number(paintTileTypeSelect.value));
      paintTileType = nextType < 0 ? 0 : nextType;
      setStatus(`Tile de pintura: ${paintTileType}.`, "ok");
    });
  }

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

  if (inputParallaxAnchor) {
    inputParallaxAnchor.addEventListener("change", () => {
      levelParallaxAnchor = inputParallaxAnchor.value === "bottom" ? "bottom" : "top";
      setStatus(`Parallax anclado: ${levelParallaxAnchor === "bottom" ? "abajo" : "arriba"}.`, "ok");
    });
  }

  if (btnParallaxFilesApply) {
    btnParallaxFilesApply.addEventListener("click", async () => {
      const current = normalizeParallaxFiles(levelParallaxFiles);
      const nextSky = await resolveAssetInputToPath(inputParallaxSky?.value, current.sky);
      const nextFar = await resolveAssetInputToPath(inputParallaxFar?.value, current.far);
      const nextMid = await resolveAssetInputToPath(inputParallaxMid?.value, current.mid);
      levelParallaxFiles = normalizeParallaxFiles({
        sky: nextSky,
        far: nextFar,
        mid: nextMid
      });
      syncParallaxInputs();
      setStatus("Archivos de parallax actualizados.", "ok");
    });
  }

  if (btnBgmApply) {
    btnBgmApply.addEventListener("click", async () => {
      levelBgmFile = await resolveMusicInputToPath(inputBgmFile?.value, levelBgmFile);
      syncBgmInput();
      setStatus("Archivo de musica de fondo actualizado.", "ok");
    });
  }

  if (inputBgmSelect) {
    inputBgmSelect.addEventListener("change", () => {
      const selected = (inputBgmSelect.value || "").trim();
      if (!selected) {
        return;
      }
      levelBgmFile = selected;
      syncBgmInput();
      setStatus("BGM seleccionado desde archivos disponibles.", "ok");
    });
  }

  if (btnDecorApply) {
    btnDecorApply.addEventListener("click", async () => {
      const imageInput = (inputDecorImage.value || "").trim();
      if (!imageInput) {
        setStatus("Indica la ruta de imagen para la capa decorativa.", "warn");
        return;
      }
      const image = await resolveAssetInputToPath(imageInput, "");
      if (!image) {
        setStatus("No se encontro archivo para la capa decorativa en ./assets.", "warn");
        return;
      }

      const maxX = levelCols * WORLD_TILE_SIZE;
      const maxY = levelRows * WORLD_TILE_SIZE;
      levelDecorLayer = {
        image,
        x: clampNumber(Number(inputDecorX.value), 0, maxX, 0),
        y: clampNumber(Number(inputDecorY.value), 0, maxY, 0),
        scale: clampFloat(Number(inputDecorScale.value), 0.1, 8, 1),
        alpha: clampFloat(Number(inputDecorAlpha.value), 0, 1, 1),
        depth: clampFloat(Number(inputDecorDepth.value), -10, 20, 2.6)
      };
      syncDecorInputs();
      render();
      setStatus("Capa decorativa actualizada.", "ok");
    });
  }

  if (btnDecorClear) {
    btnDecorClear.addEventListener("click", () => {
      levelDecorLayer = null;
      syncDecorInputs();
      render();
      setStatus("Capa decorativa eliminada.", "warn");
    });
  }

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

  document.getElementById("btnDownloadSvgGuide").addEventListener("click", () => {
    const levelName = safeName(getCurrentRecord()?.name || "level");
    const svg = buildGroundGuideSvg(levelName);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${levelName}_guia_suelo.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Guia SVG descargada para Illustrator.", "ok");
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

function syncParallaxInputs() {
  if (inputParallaxAnchor) {
    inputParallaxAnchor.value = levelParallaxAnchor;
  }
  if (inputParallaxSky) {
    inputParallaxSky.value = extractAssetBaseName(levelParallaxFiles.sky);
  }
  if (inputParallaxFar) {
    inputParallaxFar.value = extractAssetBaseName(levelParallaxFiles.far);
  }
  if (inputParallaxMid) {
    inputParallaxMid.value = extractAssetBaseName(levelParallaxFiles.mid);
  }
}

function syncBgmInput() {
  if (!inputBgmFile) {
    return;
  }
  inputBgmFile.value = extractAssetBaseName(levelBgmFile);
  syncBgmSelect();
}

function syncBgmSelect() {
  if (!inputBgmSelect) {
    return;
  }

  const options = [
    { value: "", label: "BGM disponible..." },
    ...AVAILABLE_MUSIC_FILES.map((path) => ({
      value: path,
      label: extractAssetBaseName(path)
    }))
  ];

  inputBgmSelect.innerHTML = "";
  options.forEach((optionDef) => {
    const option = document.createElement("option");
    option.value = optionDef.value;
    option.textContent = optionDef.label;
    inputBgmSelect.appendChild(option);
  });

  const normalizedCurrent = normalizeBgmFile(levelBgmFile);
  const hasCurrent = AVAILABLE_MUSIC_FILES.some((path) => path === normalizedCurrent);
  inputBgmSelect.value = hasCurrent ? normalizedCurrent : "";
}

function syncDecorInputs() {
  if (!inputDecorImage) {
    return;
  }
  if (!levelDecorLayer) {
    inputDecorImage.value = "";
    inputDecorX.value = "0";
    inputDecorY.value = "0";
    inputDecorScale.value = "1";
    inputDecorAlpha.value = "1";
    inputDecorDepth.value = "2.6";
    return;
  }
  inputDecorImage.value = extractAssetBaseName(levelDecorLayer.image);
  inputDecorX.value = String(levelDecorLayer.x);
  inputDecorY.value = String(levelDecorLayer.y);
  inputDecorScale.value = String(levelDecorLayer.scale);
  inputDecorAlpha.value = String(levelDecorLayer.alpha);
  inputDecorDepth.value = String(levelDecorLayer.depth);
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
  levelEntities.entrySpawnFromLeft = clampPoint(levelEntities.entrySpawnFromLeft, null, maxX, maxY);
  levelEntities.entrySpawnFromRight = clampPoint(levelEntities.entrySpawnFromRight, null, maxX, maxY);
  levelEntities.enemySpawns = levelEntities.enemySpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.chargerSpawns = levelEntities.chargerSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.turretSpawns = levelEntities.turretSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.flyingSpawns = levelEntities.flyingSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelEntities.bomberSpawns = levelEntities.bomberSpawns.filter((p) => p.x >= 0 && p.x <= maxX && p.y >= 0 && p.y <= maxY);
  levelDecorLayer = normalizeDecorLayer(levelDecorLayer, maxX, maxY);

  setCanvasSize();
}

function actAtPointer(event, forceErase) {
  const pos = getPointerWorld(event);
  if (!pos) {
    return;
  }

  if (tool === "paint" || tool === "erase") {
    const value = forceErase || tool === "erase" ? -1 : paintTileType;
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
  if (currentTool === "entryLeft") {
    levelEntities.entrySpawnFromLeft = { x, y };
    return;
  }
  if (currentTool === "entryRight") {
    levelEntities.entrySpawnFromRight = { x, y };
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
  if (levelEntities.entrySpawnFromLeft) {
    candidates.push({ type: "entrySpawnFromLeft", index: -1, x: levelEntities.entrySpawnFromLeft.x, y: levelEntities.entrySpawnFromLeft.y });
  }
  if (levelEntities.entrySpawnFromRight) {
    candidates.push({ type: "entrySpawnFromRight", index: -1, x: levelEntities.entrySpawnFromRight.x, y: levelEntities.entrySpawnFromRight.y });
  }

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
  if (best.type === "entrySpawnFromLeft") {
    levelEntities.entrySpawnFromLeft = null;
    return;
  }
  if (best.type === "entrySpawnFromRight") {
    levelEntities.entrySpawnFromRight = null;
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
      ctx.fillStyle = getTileColor(grid[y][x]);
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
  if (levelDecorLayer) {
    drawMarker(levelDecorLayer.x, levelDecorLayer.y, "#c8b8ff", "D");
  }
  drawMarker(levelEntities.playerSpawn.x, levelEntities.playerSpawn.y, "#4aa3ff", "P");
  if (levelEntities.entrySpawnFromLeft) {
    drawMarker(levelEntities.entrySpawnFromLeft.x, levelEntities.entrySpawnFromLeft.y, "#6ed9ff", "L");
  }
  if (levelEntities.entrySpawnFromRight) {
    drawMarker(levelEntities.entrySpawnFromRight.x, levelEntities.entrySpawnFromRight.y, "#67c8ff", "R");
  }
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
    entrySpawnFromLeft: null,
    entrySpawnFromRight: null,
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
    parallaxAnchor: "top",
    parallaxFiles: getDefaultParallaxFiles(),
    bgmFile: getDefaultBgmFile(),
    decorLayer: null,
    data: buildDefaultGrid(cols, rows),
    ...getDefaultEntities(cols, rows)
  };
}

function toExportObject() {
  return {
    cols: levelCols,
    rows: levelRows,
    tileSize: WORLD_TILE_SIZE,
    parallaxAnchor: levelParallaxAnchor,
    parallaxFiles: { ...levelParallaxFiles },
    bgmFile: levelBgmFile,
    decorLayer: levelDecorLayer ? { ...levelDecorLayer } : null,
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
      return row.map((cell) => normalizeTileValue(cell));
    });

    const maxX = cols * WORLD_TILE_SIZE;
    const maxY = rows * WORLD_TILE_SIZE;
    const defaults = getDefaultEntities(cols, rows);

    return {
      cols,
      rows,
      parallaxAnchor: obj.parallaxAnchor === "bottom" ? "bottom" : "top",
      parallaxFiles: normalizeParallaxFiles(obj.parallaxFiles),
      bgmFile: normalizeBgmFile(obj.bgmFile),
      decorLayer: normalizeDecorLayer(obj.decorLayer, maxX, maxY),
      data: normalizedGrid,
      playerSpawn: clampPoint(obj.playerSpawn, defaults.playerSpawn, maxX, maxY),
      entrySpawnFromLeft: clampPoint(obj.entrySpawnFromLeft, defaults.entrySpawnFromLeft, maxX, maxY),
      entrySpawnFromRight: clampPoint(obj.entrySpawnFromRight, defaults.entrySpawnFromRight, maxX, maxY),
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
  levelParallaxAnchor = parsed.parallaxAnchor === "bottom" ? "bottom" : "top";
  levelParallaxFiles = normalizeParallaxFiles(parsed.parallaxFiles);
  levelBgmFile = normalizeBgmFile(parsed.bgmFile);
  syncParallaxInputs();
  syncBgmInput();
  levelDecorLayer = parsed.decorLayer ? { ...parsed.decorLayer } : null;
  syncDecorInputs();
  grid = parsed.data;
  levelEntities = {
    playerSpawn: parsed.playerSpawn,
    entrySpawnFromLeft: parsed.entrySpawnFromLeft,
    entrySpawnFromRight: parsed.entrySpawnFromRight,
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

function normalizeTileValue(value) {
  const num = Number(value);
  const maxId = tileDefinitions.reduce((max, item) => Math.max(max, item.id), 3);
  if (Number.isInteger(num) && num >= 0 && num <= maxId) {
    return num;
  }
  return -1;
}

function getTileColor(value) {
  const tileDef = tileDefinitions.find((item) => item.id === value);
  if (tileDef && typeof tileDef.color === "string") {
    return tileDef.color;
  }
  return "#1f3558";
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampFloat(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

function normalizeDecorLayer(value, maxX, maxY) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const image = typeof value.image === "string" ? value.image.trim() : "";
  if (!image) {
    return null;
  }
  return {
    image,
    x: clampNumber(Number(value.x), 0, maxX, 0),
    y: clampNumber(Number(value.y), 0, maxY, 0),
    scale: clampFloat(Number(value.scale), 0.1, 8, 1),
    alpha: clampFloat(Number(value.alpha), 0, 1, 1),
    depth: clampFloat(Number(value.depth), -10, 20, 2.6)
  };
}

function getDefaultParallaxFiles() {
  return {
    sky: "./assets/bg_sky.svg",
    far: "./assets/bg_far.png",
    mid: "./assets/bg_mountains.png"
  };
}

function getDefaultBgmFile() {
  return "./music/Arcade-Goblins.ogg";
}

function normalizeBgmFile(value) {
  if (typeof value !== "string") {
    return getDefaultBgmFile();
  }
  const trimmed = value.trim();
  return trimmed || getDefaultBgmFile();
}

function normalizeParallaxFiles(value) {
  const defaults = getDefaultParallaxFiles();
  if (!value || typeof value !== "object") {
    return { ...defaults };
  }
  const clean = (candidate, fallback) => {
    if (typeof candidate !== "string") {
      return fallback;
    }
    const trimmed = candidate.trim();
    return trimmed || fallback;
  };
  return {
    sky: clean(value.sky, defaults.sky),
    far: clean(value.far, defaults.far),
    mid: clean(value.mid, defaults.mid)
  };
}

async function resolveAssetInputToPath(value, fallbackPath) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return fallbackPath || "";
  }

  if (raw.includes("/") || raw.includes("\\") || /\.[a-z0-9]+$/i.test(raw)) {
    return raw;
  }

  for (const ext of ASSET_EXTENSIONS) {
    const candidate = `./assets/${raw}${ext}`;
    try {
      const response = await fetch(candidate, { method: "GET", cache: "no-store" });
      if (response.ok) {
        return candidate;
      }
    } catch {
      return fallbackPath || "";
    }
  }

  return fallbackPath || `./assets/${raw}.png`;
}

async function resolveMusicInputToPath(value, fallbackPath) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return fallbackPath || getDefaultBgmFile();
  }

  if (raw.includes("/") || raw.includes("\\") || /\.[a-z0-9]+$/i.test(raw)) {
    return raw;
  }

  for (const ext of MUSIC_EXTENSIONS) {
    const candidate = `./music/${raw}${ext}`;
    try {
      const response = await fetch(candidate, { method: "GET", cache: "no-store" });
      if (response.ok) {
        return candidate;
      }
    } catch {
      return fallbackPath || getDefaultBgmFile();
    }
  }

  return fallbackPath || `./music/${raw}.ogg`;
}

function extractAssetBaseName(path) {
  if (typeof path !== "string" || !path.trim()) {
    return "";
  }
  const clean = path.trim().replace(/\\/g, "/");
  const fileName = clean.split("/").pop() || clean;
  return fileName.replace(/\.[^/.]+$/, "");
}

function getDefaultTileDefinitions() {
  return [
    { id: 0, name: "Piso", color: "#7ebc56" },
    { id: 1, name: "Bloque rompible", color: "#8f7a66" },
    { id: 2, name: "Piso resbaladizo", color: "#6d8ba9" },
    { id: 3, name: "Atravesable", color: "#b88ad1" },
    { id: 4, name: "Plataforma animada", color: "#5ab4ff" }
  ];
}

function loadTileDefinitions() {
  const defaults = getDefaultTileDefinitions();
  try {
    const raw = localStorage.getItem(TILE_DEFS_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaults;
    }
    const safe = parsed
      .map((item) => {
        const id = Number(item?.id);
        if (!Number.isInteger(id) || id < 0) {
          return null;
        }
        const fallback = defaults.find((entry) => entry.id === id);
        const name = typeof item.name === "string" && item.name.trim()
          ? item.name.trim()
          : (fallback?.name || `Tile ${id}`);
        const color = typeof item.color === "string" && item.color.trim()
          ? item.color.trim()
          : (fallback?.color || "#7ebc56");
        return { id, name, color };
      })
      .filter((item) => item !== null);

    if (!safe.length) {
      return defaults;
    }

    const merged = [...safe];
    const existingIds = new Set(merged.map((item) => item.id));
    defaults.forEach((base) => {
      if (!existingIds.has(base.id)) {
        merged.push({ ...base });
      }
    });

    return merged.sort((a, b) => a.id - b.id);
  } catch {
    return defaults;
  }
}

function syncTileDefinitionsUI() {
  if (paintTileTypeSelect) {
    paintTileTypeSelect.innerHTML = "";
    tileDefinitions.forEach((item) => {
      const option = document.createElement("option");
      option.value = String(item.id);
      option.textContent = `Tile ${item.id}: ${item.name}`;
      paintTileTypeSelect.appendChild(option);
    });
    const hasCurrent = tileDefinitions.some((item) => item.id === paintTileType);
    paintTileType = hasCurrent ? paintTileType : tileDefinitions[0]?.id ?? 0;
    paintTileTypeSelect.value = String(paintTileType);
  }

  if (tileLegendEl) {
    const lines = tileDefinitions
      .map((item) => (
        `<div><span class="dot" style="background:${escapeHtml(item.color)}"></span>\`${item.id}\` = ${escapeHtml(item.name)}</div>`
      ))
      .join("");
    tileLegendEl.innerHTML = `${lines}<div><span class="dot empty"></span>\`-1\` = vacio</div>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "warn", "danger");
  statusEl.classList.add(type || "ok");
}

function buildGroundGuideSvg(levelName) {
  const widthPx = levelCols * WORLD_TILE_SIZE;
  const heightPx = levelRows * WORLD_TILE_SIZE;
  const tileRects = [];

  for (let y = 0; y < levelRows; y += 1) {
    for (let x = 0; x < levelCols; x += 1) {
      if (grid[y][x] === 0) {
        tileRects.push(`<rect x="${x * WORLD_TILE_SIZE}" y="${y * WORLD_TILE_SIZE}" width="${WORLD_TILE_SIZE}" height="${WORLD_TILE_SIZE}" />`);
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">`,
    "  <defs>",
    "    <style>",
    "      .ground { fill: #57b84f; fill-opacity: 0.28; stroke: #2d6a30; stroke-width: 1; }",
    "      .frame { fill: none; stroke: #1c2b3a; stroke-width: 2; }",
    "      .label { fill: #1c2b3a; font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; font-size: 18px; }",
    "    </style>",
    "  </defs>",
    `  <rect class="frame" x="1" y="1" width="${Math.max(0, widthPx - 2)}" height="${Math.max(0, heightPx - 2)}" />`,
    `  <text class="label" x="14" y="26">${escapeXml(`Guia suelo: ${levelName} (${levelCols}x${levelRows} tiles)`)}</text>`,
    `  <g class="ground">${tileRects.join("")}</g>`,
    "</svg>"
  ].join("\n");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
