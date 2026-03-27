const STORAGE_KEY = "microgame_player_params_v1";

const FIELDS = [
  { key: "maxSpeed", label: "Velocidad Max", min: 80, max: 800, step: 1, def: 300 },
  { key: "acceleration", label: "Aceleracion", min: 200, max: 4000, step: 10, def: 1800 },
  { key: "dragX", label: "Friccion X", min: 100, max: 4000, step: 10, def: 1400 },
  { key: "jumpVelocity", label: "Fuerza Salto", min: -1400, max: -200, step: 10, def: -680 },
  { key: "jumpSpeedBonus", label: "Bonus Salto En Carrera", min: 0, max: 500, step: 1, def: 120 },
  { key: "jumpCutMultiplier", label: "Corte Salto", min: 0.2, max: 1, step: 0.01, def: 0.5 },
  { key: "attackDurationMs", label: "Duracion Ataque (ms)", min: 50, max: 500, step: 1, def: 130 },
  { key: "attackCooldownMs", label: "Cooldown Ataque (ms)", min: 80, max: 1000, step: 1, def: 220 },
  { key: "attackOffsetX", label: "Offset Ataque X", min: 8, max: 80, step: 1, def: 30 },
  { key: "attackOffsetY", label: "Offset Ataque Y", min: -40, max: 40, step: 1, def: -8 },
  { key: "maxLives", label: "Vidas Iniciales", min: 1, max: 5000, step: 1, def: 3 }
];

const formGrid = document.getElementById("formGrid");
const jsonOut = document.getElementById("jsonOut");
const statusEl = document.getElementById("status");
const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");

const inputs = {};

buildForm();
loadIntoForm();
renderJsonPreview();

btnSave.addEventListener("click", () => {
  const payload = readFormValues();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  renderJsonPreview(payload);
  setStatus("Parametros guardados. Recarga el juego para ver cambios.", "ok");
});

btnReset.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  loadIntoForm();
  renderJsonPreview(readFormValues());
  setStatus("Defaults restaurados.", "warn");
});

function buildForm() {
  FIELDS.forEach((field) => {
    const label = document.createElement("label");
    label.textContent = field.label;

    const input = document.createElement("input");
    input.type = "number";
    input.min = String(field.min);
    input.max = String(field.max);
    input.step = String(field.step);
    input.value = String(field.def);
    input.addEventListener("input", () => renderJsonPreview(readFormValues()));

    inputs[field.key] = input;
    label.appendChild(input);
    formGrid.appendChild(label);
  });
}

function loadIntoForm() {
  const saved = loadSaved();
  FIELDS.forEach((field) => {
    const value = saved[field.key] ?? field.def;
    inputs[field.key].value = String(clamp(Number(value), field.min, field.max, field.def));
  });
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readFormValues() {
  const payload = {};
  FIELDS.forEach((field) => {
    const num = Number(inputs[field.key].value);
    payload[field.key] = clamp(num, field.min, field.max, field.def);
  });
  return payload;
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

function renderJsonPreview(payload) {
  const value = payload || readFormValues();
  jsonOut.textContent = JSON.stringify(value, null, 2);
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "warn");
  statusEl.classList.add(type || "ok");
}
