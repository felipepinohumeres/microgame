const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;
const CAMERA_BG_COLOR = 0x8fc9ec;
const TILE_SIZE = 32;
const WORLD_WIDTH_TILES = 120;
const WORLD_HEIGHT_TILES = 17;
const LEVEL_STORAGE_KEY = "microgame_level_v1";
const LEVELS_STORAGE_KEY = "microgame_levels_v1";
const ACTIVE_LEVEL_ID_KEY = "microgame_level_active_id";
const LEVEL_INDEX_STORAGE_KEY = "microgame_level_index_v1";
const LEVEL_ENTRY_SIDE_KEY = "microgame_level_entry_side_v1";
const LEVELS_MANIFEST_FILE = "./levels/manifest.json";
const TILE_DEFS_STORAGE_KEY = "microgame_tile_defs_v1";
const TILESET_ATLAS_FILE = "./assets/tileset_platform.svg";
const TILESET_ATLAS_TILE_SIZE = 32;
const TILE_ANIMATION_FRAME_MS = 170;
const PARALLAX_ANCHOR_TOP = "top";
const PARALLAX_ANCHOR_BOTTOM = "bottom";
const PARALLAX_BG_SKY_DEFAULT = "./assets/bg_sky.svg";
const PARALLAX_BG_FAR_DEFAULT = "./assets/bg_far.png";
const PARALLAX_BG_MID_DEFAULT = "./assets/bg_mountains.png";
const PLAYER_PARAMS_STORAGE_KEY = "microgame_player_params_v1";
const PLAYER_MAX_SPEED = 300;
const PLAYER_ACCELERATION = 1800;
const PLAYER_DRAG_X = 1400;
const PLAYER_JUMP_VELOCITY = -680;
const PLAYER_JUMP_SPEED_BONUS = 120;
const PLAYER_JUMP_CUT_MULTIPLIER = 0.5;
const PLAYER_ATTACK_DURATION_MS = 130;
const PLAYER_ATTACK_COOLDOWN_MS = 220;
const PLAYER_ATTACK_OFFSET_X = 30;
const PLAYER_ATTACK_OFFSET_Y = -8;
const PLAYER_SFX_VOLUME = 1;
const PLAYER_SFX_GAIN_BOOST = 3;
const BGM_DEFAULT_FILE = "./music/Arcade-Goblins.ogg";
const BGM_DEFAULT_VOLUME = 0.45;
const BGM_LEVEL_FADE_MS = 700;
const BGM_LEVEL_SWITCH_GAP_MS = 120;
const LEVEL_VISUAL_FADE_MS = 380;
const PLAYER_ATTACK_SCORE = 25;
const PLAYER_BREAK_TILE_SCORE = 5;
const PLAYER_DEFAULT_LIVES = 3;
const PLAYER_SLIPPERY_DRAG_X = 260;
const PLAYER_PARAMS = loadPlayerParams();
const TILE_DEFS = loadTileDefinitions();
const MAX_TILE_ID = TILE_DEFS.reduce((max, item) => Math.max(max, item.id), 0);
const TILE_DEFS_BY_ID = new Map(TILE_DEFS.map((item) => [item.id, item]));
const TILE_RUNTIME_META = buildTileRuntimeMeta(TILE_DEFS);
const RUNTIME_TO_BASE_TILE_ID = TILE_RUNTIME_META.runtimeToBaseMap;
const SOLID_RUNTIME_TILE_IDS = TILE_RUNTIME_META.solidRuntimeTileIds;
const ANIMATED_TILE_GROUPS = TILE_RUNTIME_META.animatedGroups;
const MAX_RUNTIME_TILE_ID = TILE_RUNTIME_META.maxRuntimeTileId;
const ENEMY_PATROL_SPEED = 90;
const ENEMY_CHASE_SPEED = 145;
const ENEMY_ACCELERATION = 1100;
const ENEMY_DRAG_X = 900;
const ENEMY_TURN_DRAG_X = 1800;
const ENEMY_TURN_DELAY_MS = 170;
const ENEMY_CHASE_RANGE = 320;
const ENEMY_SHOOT_RANGE = 420;
const ENEMY_JUMP_VELOCITY = -430;
const ENEMY_FIRE_COOLDOWN_MS = 1700;
const ENEMY_JUMP_COOLDOWN_MS = 1200;
const FLYING_ATTACK_TRIGGER_X_SOFT = 220;
const FLYING_ATTACK_TRIGGER_X_HARD = 120;
const FLYING_LOCK_ON_MS = 320;
const FLYING_WINDUP_MS = 260;
const FLYING_DIVE_SPEED = 260;
const FLYING_RETURN_SPEED = 180;
const FLYING_MAX_DIVE_DISTANCE = 220;
const FLYING_ATTACK_COOLDOWN_MS = 1500;
const FLYING_IDLE_WOBBLE_PX = 12;
const FLYING_IDLE_WOBBLE_SPEED = 0.0028;
const CHARGER_PATROL_SPEED = 60;
const CHARGER_CHARGE_SPEED = 330;
const CHARGER_TRIGGER_RANGE_X = 260;
const CHARGER_TRIGGER_RANGE_Y = 70;
const CHARGER_WINDUP_MS = 350;
const CHARGER_COOLDOWN_MS = 1300;
const TURRET_FIRE_RANGE_X = 520;
const TURRET_AIM_RANGE_Y = 110;
const TURRET_FIRE_COOLDOWN_MS = 1450;
const TURRET_PROJECTILE_SPEED = 220;
const BOMBER_TRIGGER_RANGE_X = 170;
const BOMBER_COOLDOWN_MS = 1800;
const BOMBER_DROP_WINDUP_MS = 220;
const BOMB_GRAVITY_Y = 900;
const BOMB_BOUNCE_Y = 0.2;
const PROJECTILE_INITIAL_SPEED = 85;
const PROJECTILE_MAX_SPEED = 290;
const PROJECTILE_ACCELERATION_X = 620;
const PROJECTILE_LIFETIME_MS = 2600;
const DEFAULT_PLAYER_SPAWN = { x: 96, y: 364 };
const DEFAULT_GROUND_ENEMIES = [720, 1280, 1640, 2100, 2550, 3050, 3460];
const DEFAULT_FLYING_ENEMIES = [
  { x: 980, y: 180 },
  { x: 1760, y: 160 },
  { x: 2460, y: 200 },
  { x: 3260, y: 170 }
];
const DEFAULT_CHARGERS = [1420, 2320, 3380];
const DEFAULT_TURRETS = [1160, 2010, 2870];
const DEFAULT_BOMBERS = [
  { x: 1540, y: 150 },
  { x: 2740, y: 170 },
  { x: 3560, y: 150 }
];

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1100 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

bootstrapGame();

async function bootstrapGame() {
  await bootstrapLevelsFromFiles();
  new Phaser.Game(config);
}

let player;
let cursors;
let stars;
let enemies;
let flyingEnemies;
let chargerEnemies;
let turretEnemies;
let bomberEnemies;
let enemyProjectiles;
let turretProjectiles;
let enemyBombs;
let worldLayer;
let score = 0;
let lives = PLAYER_PARAMS.maxLives;
let scoreText;
let livesText;
let levelText;
let bgSky;
let bgMountainsFar;
let bgMountainsMid;
let decorLayerSprite;
let isInvulnerable = false;
const touchState = { left: false, right: false, jump: false, attack: false };
let touchControlsBound = false;
let touchJumpWasDown = false;
let touchAttackWasDown = false;
let jumpCutApplied = false;
let attackKey;
let attackHitbox;
let attackFx;
let attackActiveUntil = 0;
let attackCooldownUntil = 0;
let isAttacking = false;
let fxAudioContext;
let bgmTrack;
let nextLevelKey;
let prevLevelKey;
let currentLevelIndex = 0;
let currentLevelCount = 1;
let currentLevelIds = [];
let transitioningLevel = false;
let lastBrokenTile = null;
let animatedTileState = null;

async function bootstrapLevelsFromFiles() {
  if (hasUsableStoredCampaign()) {
    return;
  }

  try {
    const manifestResponse = await fetch(LEVELS_MANIFEST_FILE, { cache: "no-store" });
    if (!manifestResponse.ok) {
      return;
    }

    const manifest = await manifestResponse.json();
    const entries = Array.isArray(manifest?.levels) ? manifest.levels : [];
    if (!entries.length) {
      return;
    }

    const loaded = [];
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const file = typeof entry?.file === "string" ? entry.file.trim() : "";
      if (!file) {
        continue;
      }
      const filePath = file.startsWith("./") ? file : `./levels/${file.replace(/^[/\\]+/, "")}`;
      const response = await fetch(filePath, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      loaded.push({
        id: typeof entry?.id === "string" && entry.id.trim() ? entry.id.trim() : `level_${i + 1}`,
        name: typeof entry?.name === "string" && entry.name.trim() ? entry.name.trim() : `Nivel ${i + 1}`,
        payload
      });
    }

    if (!loaded.length) {
      return;
    }

    const requestedActiveId = typeof manifest?.activeId === "string" ? manifest.activeId.trim() : "";
    const activeId = loaded.some((lvl) => lvl.id === requestedActiveId) ? requestedActiveId : loaded[0].id;

    localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify({
      levels: loaded,
      activeId
    }));
    localStorage.setItem(ACTIVE_LEVEL_ID_KEY, activeId);
    localStorage.setItem(LEVEL_INDEX_STORAGE_KEY, "0");
  } catch {
    // Sin bloqueo: el juego cae al flujo local/default si no se puede leer el manifiesto.
  }
}

function hasUsableStoredCampaign() {
  try {
    const raw = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.levels) && parsed.levels.length > 0;
  } catch {
    return false;
  }
}

function preload() {
  const preloadParallaxFiles = getPreloadParallaxFiles();
  const preloadBgmFile = getPreloadBgmFile();

  this.load.spritesheet("player", "./assets/player_sheet.svg", {
    frameWidth: 32,
    frameHeight: 48
  });
  this.load.image("enemyGround", "./assets/enemy_ground.svg");
  this.load.image("enemyFlying", "./assets/enemy_flying.svg");
  this.load.image("enemyCharger", "./assets/enemy_charger.svg");
  this.load.image("enemyTurret", "./assets/enemy_turret.svg");
  this.load.image("enemyBomber", "./assets/enemy_bomber.svg");
  this.load.image("playerAttackFx", "./assets/player_attack.svg");
  this.load.image("tileAtlasDefault", TILESET_ATLAS_FILE);
  this.load.image("bgSkyDefault", PARALLAX_BG_SKY_DEFAULT);
  this.load.image("bgFarDefault", PARALLAX_BG_FAR_DEFAULT);
  this.load.image("bgMidDefault", PARALLAX_BG_MID_DEFAULT);
  preloadParallaxTexture(this, "sky", preloadParallaxFiles.sky);
  preloadParallaxTexture(this, "far", preloadParallaxFiles.far);
  preloadParallaxTexture(this, "mid", preloadParallaxFiles.mid);
  this.load.audio("bgmDefault", BGM_DEFAULT_FILE);
  preloadBgmAudio(this, preloadBgmFile);
}

function create() {
  transitioningLevel = false;
  createStarTexture(this);
  createEnemyProjectileTexture(this);
  createAttackHitboxTexture(this);
  createPlayerAnimations(this);
  const levelConfig = getLevelConfig();
  currentLevelIndex = levelConfig.levelIndex || 0;
  currentLevelCount = levelConfig.levelCount || 1;
  currentLevelIds = Array.isArray(levelConfig.levelIds) ? levelConfig.levelIds : [];
  if (levelConfig.levelId) {
    localStorage.setItem(ACTIVE_LEVEL_ID_KEY, levelConfig.levelId);
  }

  const map = this.make.tilemap({
    data: levelConfig.data,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE
  });

  createRuntimeTilesetTexture(this);
  const tileset = map.addTilesetImage("tilePlatformRuntime");
  worldLayer = map.createLayer(0, tileset, 0, 0);
  worldLayer.setCollision(Array.from(SOLID_RUNTIME_TILE_IDS));
  worldLayer.setDepth(3);
  animatedTileState = initializeAnimatedTiles(worldLayer);

  const worldWidth = map.widthInPixels;
  const worldHeight = map.heightInPixels;
  const parallaxKeys = getParallaxTextureKeysForLevel(this, levelConfig.parallaxFiles);
  const bgmKey = getBgmAudioKeyForLevel(this, levelConfig.bgmFile);

  bgSky = createParallaxLayer(this, parallaxKeys.sky, worldWidth, worldHeight, levelConfig.parallaxAnchor, 0.15, 0.12, 0, {
    alpha: 1
  });
  bgMountainsFar = createParallaxLayer(this, parallaxKeys.far, worldWidth, worldHeight, levelConfig.parallaxAnchor, 0.24, 0.16, 1, {
    alpha: 0.8
  });
  bgMountainsMid = createParallaxLayer(this, parallaxKeys.mid, worldWidth, worldHeight, levelConfig.parallaxAnchor, 0.35, 0.24, 2, {
    alpha: 0.88
  });

  this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  createDecorSupportLayer(this, levelConfig.decorLayer);

  player = this.physics.add.sprite(levelConfig.playerSpawn.x, levelConfig.playerSpawn.y, "player");
  player.setCollideWorldBounds(true);
  player.setSize(20, 44).setOffset(6, 4);
  player.setMaxVelocity(PLAYER_PARAMS.maxSpeed, 1200);
  player.setDragX(PLAYER_PARAMS.dragX);
  player.setDepth(5);
  player.anims.play("player-idle");

  stars = this.physics.add.group();
  for (let i = 0; i < 24; i += 1) {
    const x = Phaser.Math.Between(80, worldWidth - 80);
    const y = Phaser.Math.Between(100, worldHeight - 220);
    const star = stars.create(x, y, "star");
    star.setBounceY(Phaser.Math.FloatBetween(0.2, 0.45));
    star.setDepth(4);
  }

  enemies = this.physics.add.group();
  flyingEnemies = this.physics.add.group();
  chargerEnemies = this.physics.add.group();
  turretEnemies = this.physics.add.group();
  bomberEnemies = this.physics.add.group();
  enemyProjectiles = this.physics.add.group();
  turretProjectiles = this.physics.add.group();
  enemyBombs = this.physics.add.group();
  const enemySpawns = levelConfig.enemySpawns;
  enemySpawns.forEach((spawn) => {
    const enemy = enemies.create(spawn.x, spawn.y, "enemyGround");
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(0.05);
    enemy.setMaxVelocity(ENEMY_CHASE_SPEED, 1200);
    enemy.setDragX(ENEMY_DRAG_X);
    enemy.patrolDir = Math.random() > 0.5 ? 1 : -1;
    enemy.desiredDir = enemy.patrolDir;
    enemy.turnLockUntil = 0;
    enemy.nextFireAt = Phaser.Math.Between(300, 1000);
    enemy.nextJumpAt = Phaser.Math.Between(300, 700);
    enemy.aiState = "patrol";
    enemy.lastAIState = "patrol";
    enemy.alertText = null;
    enemy.chaseBadge = this.add.text(enemy.x, enemy.y - 28, "!", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "18px",
      color: "#ffeb3b",
      stroke: "#3a1c00",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(7).setVisible(false);
    enemy.chaseBadgeTween = null;
    enemy.setAccelerationX(enemy.patrolDir * ENEMY_ACCELERATION);
    enemy.setDepth(5);
  });

  const flyingSpawns = levelConfig.flyingSpawns;
  flyingSpawns.forEach((spawn) => {
    const enemy = flyingEnemies.create(spawn.x, spawn.y, "enemyFlying");
    enemy.setDepth(5);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(0);
    enemy.body.setAllowGravity(false);
    enemy.body.setImmovable(true);
    enemy.homeX = spawn.x;
    enemy.homeY = spawn.y;
    enemy.state = "idle";
    enemy.nextAttackAt = Phaser.Math.Between(500, 1200);
    enemy.diveTargetY = spawn.y + FLYING_MAX_DIVE_DISTANCE;
    enemy.wobbleOffset = Math.random() * Math.PI * 2;
    enemy.lockOnMs = 0;
    enemy.windupUntil = 0;
  });

  const chargerSpawns = levelConfig.chargerSpawns;
  chargerSpawns.forEach((spawn) => {
    const enemy = chargerEnemies.create(spawn.x, spawn.y, "enemyCharger");
    enemy.setDepth(5);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(0.02);
    enemy.setMaxVelocity(CHARGER_CHARGE_SPEED, 1200);
    enemy.setDragX(1200);
    enemy.state = "patrol";
    enemy.dir = Math.random() > 0.5 ? 1 : -1;
    enemy.windupUntil = 0;
    enemy.cooldownUntil = Phaser.Math.Between(300, 800);
    enemy.setVelocityX(enemy.dir * CHARGER_PATROL_SPEED);
  });

  const turretSpawns = levelConfig.turretSpawns;
  turretSpawns.forEach((spawn) => {
    const enemy = turretEnemies.create(spawn.x, spawn.y, "enemyTurret");
    enemy.setDepth(5);
    enemy.setCollideWorldBounds(true);
    enemy.body.setAllowGravity(false);
    enemy.body.setImmovable(true);
    enemy.nextFireAt = Phaser.Math.Between(500, 1400);
  });

  const bomberSpawns = levelConfig.bomberSpawns;
  bomberSpawns.forEach((spawn) => {
    const enemy = bomberEnemies.create(spawn.x, spawn.y, "enemyBomber");
    enemy.setDepth(5);
    enemy.setCollideWorldBounds(true);
    enemy.body.setAllowGravity(false);
    enemy.body.setImmovable(true);
    enemy.homeX = spawn.x;
    enemy.homeY = spawn.y;
    enemy.state = "hover";
    enemy.nextDropAt = Phaser.Math.Between(700, 1400);
    enemy.windupUntil = 0;
    enemy.wobbleOffset = Math.random() * Math.PI * 2;
  });

  this.physics.add.collider(player, worldLayer);
  this.physics.add.collider(stars, worldLayer);
  this.physics.add.collider(enemies, worldLayer);
  this.physics.add.collider(chargerEnemies, worldLayer);
  this.physics.add.collider(turretEnemies, worldLayer);
  this.physics.add.collider(enemyProjectiles, worldLayer, disableProjectile, null, this);
  this.physics.add.collider(turretProjectiles, worldLayer, disableProjectile, null, this);
  this.physics.add.collider(enemyBombs, worldLayer, disableProjectile, null, this);

  this.physics.add.overlap(player, stars, collectStar, null, this);
  this.physics.add.overlap(player, enemies, hitEnemy, null, this);
  this.physics.add.overlap(player, flyingEnemies, hitEnemy, null, this);
  this.physics.add.overlap(player, chargerEnemies, hitEnemy, null, this);
  this.physics.add.overlap(player, turretEnemies, hitEnemy, null, this);
  this.physics.add.overlap(player, bomberEnemies, hitEnemy, null, this);
  this.physics.add.overlap(player, enemyProjectiles, hitByProjectile, null, this);
  this.physics.add.overlap(player, turretProjectiles, hitByProjectile, null, this);
  this.physics.add.overlap(player, enemyBombs, hitByProjectile, null, this);

  attackHitbox = this.physics.add.sprite(-1000, -1000, "attackHitbox");
  attackHitbox.setVisible(false).setDepth(6);
  attackHitbox.body.setAllowGravity(false);
  attackHitbox.body.enable = false;

  attackFx = this.add.image(-1000, -1000, "playerAttackFx");
  attackFx.setVisible(false).setDepth(7);

  this.physics.add.overlap(attackHitbox, enemies, meleeHitEnemy, null, this);
  this.physics.add.overlap(attackHitbox, flyingEnemies, meleeHitEnemy, null, this);
  this.physics.add.overlap(attackHitbox, chargerEnemies, meleeHitEnemy, null, this);
  this.physics.add.overlap(attackHitbox, turretEnemies, meleeHitEnemy, null, this);
  this.physics.add.overlap(attackHitbox, bomberEnemies, meleeHitEnemy, null, this);

  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  this.cameras.main.setBackgroundColor(CAMERA_BG_COLOR);
  this.cameras.main.startFollow(player, true, 0.09, 0.09);
  this.cameras.main.setDeadzone(120, 60);
  this.cameras.main.fadeIn(LEVEL_VISUAL_FADE_MS, 0, 0, 0);

  cursors = this.input.keyboard.createCursorKeys();
  attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  nextLevelKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
  prevLevelKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  ensureBgmPlaying(this, bgmKey);
  this.input.once("pointerdown", unlockFxAudioContext);
  this.input.keyboard.once("keydown", unlockFxAudioContext);
  this.input.once("pointerdown", () => ensureBgmPlaying(this, bgmKey));
  this.input.keyboard.once("keydown", () => ensureBgmPlaying(this, bgmKey));
  bindTouchControls();

  scoreText = this.add.text(16, 16, "Puntaje: 0", {
    fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
    fontSize: "24px",
    color: "#ffffff",
    stroke: "#1d3557",
    strokeThickness: 4
  }).setScrollFactor(0).setDepth(10);

  livesText = this.add.text(16, 48, `Vidas: ${lives}`, {
    fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
    fontSize: "24px",
    color: "#ffffff",
    stroke: "#1d3557",
    strokeThickness: 4
  }).setScrollFactor(0).setDepth(10);

  levelText = this.add.text(16, 80, `${levelConfig.levelName} (${currentLevelIndex + 1}/${currentLevelCount})`, {
    fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
    fontSize: "20px",
    color: "#ffffff",
    stroke: "#1d3557",
    strokeThickness: 4
  }).setScrollFactor(0).setDepth(10);

  if (currentLevelCount > 1) {
    this.add.text(16, 106, "N siguiente | P anterior", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "16px",
      color: "#d7ecff",
      stroke: "#1d3557",
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(10);
  }
}

function update() {
  updateAnimatedTiles(this);

  if (Phaser.Input.Keyboard.JustDown(nextLevelKey)) {
    changeLevel(this, 1);
    return;
  }
  if (Phaser.Input.Keyboard.JustDown(prevLevelKey)) {
    changeLevel(this, -1);
    return;
  }

  const left = cursors.left.isDown || touchState.left;
  const right = cursors.right.isDown || touchState.right;
  const jumpHeld = cursors.up.isDown || cursors.space.isDown || touchState.jump;
  const jumpPressed =
    Phaser.Input.Keyboard.JustDown(cursors.up) ||
    Phaser.Input.Keyboard.JustDown(cursors.space) ||
    (touchState.jump && !touchJumpWasDown);
  const attackPressed = Phaser.Input.Keyboard.JustDown(attackKey) || (touchState.attack && !touchAttackWasDown);

  if (!transitioningLevel && player && worldLayer) {
    if (player.x >= worldLayer.width - 40 && right) {
      changeLevel(this, 1);
      return;
    }
    if (player.x <= 20 && left) {
      changeLevel(this, -1);
      return;
    }
  }

  if (left) {
    player.setAccelerationX(-PLAYER_PARAMS.acceleration);
    player.setFlipX(true);
  } else if (right) {
    player.setAccelerationX(PLAYER_PARAMS.acceleration);
    player.setFlipX(false);
  } else {
    player.setAccelerationX(0);
  }

  if (jumpPressed && player.body.blocked.down) {
    const speedRatio = Phaser.Math.Clamp(Math.abs(player.body.velocity.x) / PLAYER_PARAMS.maxSpeed, 0, 1);
    const jumpVelocity = PLAYER_PARAMS.jumpVelocity - PLAYER_PARAMS.jumpSpeedBonus * speedRatio;
    player.setVelocityY(jumpVelocity);
    jumpCutApplied = false;
  }

  if (!jumpHeld && player.body.velocity.y < 0 && !jumpCutApplied) {
    player.setVelocityY(player.body.velocity.y * PLAYER_PARAMS.jumpCutMultiplier);
    jumpCutApplied = true;
  }

  tryBreakTileAbove(this);
  applyGroundTileEffects();

  if (player.body.blocked.down) {
    jumpCutApplied = false;
  }

  touchJumpWasDown = touchState.jump;
  touchAttackWasDown = touchState.attack;

  if (attackPressed) {
    startMeleeAttack(this);
  }
  updateMeleeAttack(this);

  const isOnGround = player.body.blocked.down;
  if (isAttacking) {
    player.anims.play("player-attack", true);
  } else if (!isOnGround) {
    player.anims.play("player-jump", true);
  } else if (Math.abs(player.body.velocity.x) > 5) {
    player.anims.play("player-run", true);
  } else {
    player.anims.play("player-idle", true);
  }

  enemies.children.iterate((enemy) => {
    if (!enemy.active) {
      return;
    }
    updateEnemyAI(this, enemy);
    updateEnemyVisualFeedback(this, enemy);
  });

  flyingEnemies.children.iterate((enemy) => {
    if (!enemy.active) {
      return;
    }
    updateFlyingEnemyAI(this, enemy);
  });

  chargerEnemies.children.iterate((enemy) => {
    if (!enemy.active) {
      return;
    }
    updateChargerEnemyAI(this, enemy);
  });

  turretEnemies.children.iterate((enemy) => {
    if (!enemy.active) {
      return;
    }
    updateTurretEnemyAI(this, enemy);
  });

  bomberEnemies.children.iterate((enemy) => {
    if (!enemy.active) {
      return;
    }
    updateBomberEnemyAI(this, enemy);
  });

  enemyProjectiles.children.iterate((projectile) => {
    if (!projectile.active) {
      return;
    }

    if (projectile.expiresAt <= this.time.now) {
      disableProjectile(projectile);
    }
  });

  turretProjectiles.children.iterate((projectile) => {
    if (!projectile.active) {
      return;
    }
    if (projectile.expiresAt <= this.time.now) {
      disableProjectile(projectile);
    }
  });

  enemyBombs.children.iterate((bomb) => {
    if (!bomb.active) {
      return;
    }
    if (bomb.expiresAt <= this.time.now) {
      disableProjectile(bomb);
    }
  });

}

function bindTouchControls() {
  if (touchControlsBound) {
    return;
  }

  const buttons = document.querySelectorAll("[data-touch]");
  if (!buttons.length) {
    return;
  }

  const setTouch = (action, value, target) => {
    touchState[action] = value;
    if (target) {
      target.classList.toggle("active", value);
    }
  };

  buttons.forEach((btn) => {
    const action = btn.getAttribute("data-touch");
    if (!action || !(action in touchState)) {
      return;
    }

    btn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      setTouch(action, true, btn);
    });
    btn.addEventListener("pointerup", (event) => {
      event.preventDefault();
      setTouch(action, false, btn);
    });
    btn.addEventListener("pointerleave", () => setTouch(action, false, btn));
    btn.addEventListener("pointercancel", () => setTouch(action, false, btn));
    btn.addEventListener("contextmenu", (event) => event.preventDefault());
  });

  window.addEventListener("blur", () => {
    touchState.left = false;
    touchState.right = false;
    touchState.jump = false;
    touchState.attack = false;
    buttons.forEach((btn) => btn.classList.remove("active"));
  });

  touchControlsBound = true;
}

function collectStar(playerRef, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText(`Puntaje: ${score}`);

  if (stars.countActive(true) === 0) {
    stars.children.iterate((s) => {
      const x = Phaser.Math.Between(80, worldLayer.width - 80);
      s.enableBody(true, x, 0, true, true);
    });
  }
}

function applyGroundTileEffects() {
  const footY = player.y + player.body.height * 0.5 + 2;
  const tile = worldLayer.getTileAtWorldXY(player.x, footY, true);
  const onGround = player.body.blocked.down;
  const tileDef = getTileDefByRuntimeIndex(tile?.index);

  if (onGround && tileDef?.slippery) {
    player.setDragX(PLAYER_SLIPPERY_DRAG_X);
    return;
  }

  player.setDragX(PLAYER_PARAMS.dragX);
}

function tryBreakTileAbove(scene) {
  if (!player.body.blocked.up) {
    lastBrokenTile = null;
    return;
  }

  const headY = player.y - player.body.height * 0.5 - 2;
  const tile = worldLayer.getTileAtWorldXY(player.x, headY, true);
  const tileDef = getTileDefByRuntimeIndex(tile?.index);
  if (!tile || !tileDef?.breakable) {
    return;
  }

  if (lastBrokenTile && lastBrokenTile.x === tile.x && lastBrokenTile.y === tile.y) {
    return;
  }

  worldLayer.removeTileAt(tile.x, tile.y);
  lastBrokenTile = { x: tile.x, y: tile.y };
  score += PLAYER_BREAK_TILE_SCORE;
  scoreText.setText(`Puntaje: ${score}`);
  scene.cameras.main.shake(80, 0.003);
}

function getTileDefByRuntimeIndex(runtimeIndex) {
  if (!Number.isInteger(runtimeIndex) || runtimeIndex < 0) {
    return null;
  }
  const baseId = RUNTIME_TO_BASE_TILE_ID.get(runtimeIndex);
  const resolvedBaseId = Number.isInteger(baseId) ? baseId : runtimeIndex;
  return TILE_DEFS_BY_ID.get(resolvedBaseId) || null;
}

function hitEnemy(playerRef, enemy) {
  if (isInvulnerable || !enemy.active) {
    return;
  }
  applyPlayerDamage(this, playerRef);
}

function meleeHitEnemy(hitbox, enemy) {
  if (!enemy.active || !attackHitbox.body.enable) {
    return;
  }
  defeatEnemy(enemy, PLAYER_ATTACK_SCORE);
}

function hitByProjectile(playerRef, projectile) {
  disableProjectile(projectile);
  applyPlayerDamage(this, playerRef);
}

function applyPlayerDamage(scene, playerRef) {
  if (isInvulnerable) {
    return;
  }

  playDamageSfx();
  lives -= 1;
  livesText.setText(`Vidas: ${lives}`);

  isInvulnerable = true;
  playerRef.setTint(0xff6d6d);
  playerRef.setVelocity(0, -260);
  scene.cameras.main.shake(120, 0.008);

  scene.time.delayedCall(800, () => {
    playerRef.clearTint();
    isInvulnerable = false;
  });

  if (lives <= 0) {
    scene.physics.pause();
    playerRef.setTint(0x111111);
    scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, "GAME OVER", {
      fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
      fontSize: "52px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(12);

    scene.time.delayedCall(1700, () => {
      score = 0;
      lives = PLAYER_PARAMS.maxLives;
      isInvulnerable = false;
      scene.scene.restart();
    });
  }
}

function startMeleeAttack(scene) {
  const now = scene.time.now;
  if (now < attackCooldownUntil) {
    return;
  }
  attackActiveUntil = now + PLAYER_PARAMS.attackDurationMs;
  attackCooldownUntil = now + PLAYER_PARAMS.attackCooldownMs;
  isAttacking = true;
  positionMeleeObjects();
  attackHitbox.body.enable = true;
  attackHitbox.setVisible(false);
  attackFx.setVisible(true).setAlpha(1);
  playAttackSfx();
}

function updateMeleeAttack(scene) {
  const now = scene.time.now;
  if (now < attackActiveUntil) {
    positionMeleeObjects();
    return;
  }

  if (attackHitbox.body.enable) {
    attackHitbox.body.enable = false;
    attackHitbox.setPosition(-1000, -1000);
    attackFx.setVisible(false);
    attackFx.setPosition(-1000, -1000);
    isAttacking = false;
  }
}

function positionMeleeObjects() {
  const direction = player.flipX ? -1 : 1;
  const x = player.x + PLAYER_PARAMS.attackOffsetX * direction;
  const y = player.y + PLAYER_PARAMS.attackOffsetY;

  attackHitbox.setPosition(x, y);
  attackHitbox.setFlipX(direction < 0);

  attackFx.setPosition(x + 8 * direction, y - 2);
  attackFx.setScale(direction, 1);
}

function defeatEnemy(enemy, points) {
  cleanupEnemyFeedback(enemy);
  enemy.disableBody(true, true);
  score += points;
  scoreText.setText(`Puntaje: ${score}`);
}

function loadPlayerParams() {
  const defaults = {
    maxSpeed: PLAYER_MAX_SPEED,
    acceleration: PLAYER_ACCELERATION,
    dragX: PLAYER_DRAG_X,
    jumpVelocity: PLAYER_JUMP_VELOCITY,
    jumpSpeedBonus: PLAYER_JUMP_SPEED_BONUS,
      jumpCutMultiplier: PLAYER_JUMP_CUT_MULTIPLIER,
      attackDurationMs: PLAYER_ATTACK_DURATION_MS,
      attackCooldownMs: PLAYER_ATTACK_COOLDOWN_MS,
      attackOffsetX: PLAYER_ATTACK_OFFSET_X,
      attackOffsetY: PLAYER_ATTACK_OFFSET_Y,
      sfxVolume: PLAYER_SFX_VOLUME,
      maxLives: PLAYER_DEFAULT_LIVES
    };

  try {
    const raw = localStorage.getItem(PLAYER_PARAMS_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return {
      maxSpeed: toNumberInRange(parsed.maxSpeed, defaults.maxSpeed, 80, 800),
      acceleration: toNumberInRange(parsed.acceleration, defaults.acceleration, 200, 4000),
      dragX: toNumberInRange(parsed.dragX, defaults.dragX, 100, 4000),
      jumpVelocity: toNumberInRange(parsed.jumpVelocity, defaults.jumpVelocity, -1400, -200),
      jumpSpeedBonus: toNumberInRange(parsed.jumpSpeedBonus, defaults.jumpSpeedBonus, 0, 500),
      jumpCutMultiplier: toNumberInRange(parsed.jumpCutMultiplier, defaults.jumpCutMultiplier, 0.2, 1),
      attackDurationMs: toNumberInRange(parsed.attackDurationMs, defaults.attackDurationMs, 50, 500),
      attackCooldownMs: toNumberInRange(parsed.attackCooldownMs, defaults.attackCooldownMs, 80, 1000),
      attackOffsetX: toNumberInRange(parsed.attackOffsetX, defaults.attackOffsetX, 8, 80),
      attackOffsetY: toNumberInRange(parsed.attackOffsetY, defaults.attackOffsetY, -40, 40),
      sfxVolume: toNumberInRange(parsed.sfxVolume, defaults.sfxVolume, 0, 1),
      maxLives: Math.round(toNumberInRange(parsed.maxLives, defaults.maxLives, 1, 5000))
    };
  } catch {
    return defaults;
  }
}

function getFxAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  if (!fxAudioContext) {
    fxAudioContext = new AudioContextClass();
  }
  return fxAudioContext;
}

function ensureBgmPlaying(scene, bgmKey = "bgmDefault") {
  if (!scene || !scene.sound) {
    return;
  }

  const shouldReplaceTrack = !bgmTrack || !bgmTrack.manager || bgmTrack.key !== bgmKey;
  if (shouldReplaceTrack) {
    if (bgmTrack) {
      bgmTrack.stop();
      bgmTrack.destroy();
    }

    bgmTrack = scene.sound.get(bgmKey) || scene.sound.add(bgmKey, {
      loop: true,
      volume: BGM_DEFAULT_VOLUME
    });
  }

  if (shouldReplaceTrack || !bgmTrack.isPlaying) {
    bgmTrack.setVolume(0);
    if (!bgmTrack.isPlaying) {
      bgmTrack.play();
    }
    fadeInBgm(scene);
    return;
  }

  bgmTrack.setVolume(BGM_DEFAULT_VOLUME);
  bgmTrack.setLoop(true);
}

function unlockFxAudioContext() {
  const ctx = getFxAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function playAttackSfx() {
  playTone({ frequency: 620, duration: 0.05, type: "square", volume: 0.04, slideTo: 860 });
  playTone({ frequency: 820, duration: 0.04, type: "triangle", volume: 0.03, delay: 0.015 });
}

function playDamageSfx() {
  playTone({ frequency: 220, duration: 0.1, type: "sawtooth", volume: 0.065, slideTo: 130 });
  playTone({ frequency: 160, duration: 0.14, type: "triangle", volume: 0.045, delay: 0.03, slideTo: 90 });
}

function playTone({ frequency, duration, type, volume, delay = 0, slideTo = null }) {
  const ctx = getFxAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
    if (ctx.state === "suspended") {
      return;
    }
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startAt = ctx.currentTime + delay;
  const endAt = startAt + duration;

  osc.type = type || "sine";
  osc.frequency.setValueAtTime(frequency, startAt);
  if (slideTo !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), endAt);
  }

  const scaledVolume = Math.max(0, (volume || 0.03) * PLAYER_PARAMS.sfxVolume * PLAYER_SFX_GAIN_BOOST);
  if (scaledVolume <= 0) {
    return;
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, scaledVolume), startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(endAt + 0.02);
}

function toNumberInRange(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, num));
}

function updateEnemyAI(scene, enemy) {
  const distanceX = player.x - enemy.x;
  const absDistanceX = Math.abs(distanceX);
  const verticalDistance = Math.abs(player.y - enemy.y);
  const directionToPlayer = distanceX >= 0 ? 1 : -1;
  const seesPlayer = absDistanceX < ENEMY_CHASE_RANGE && verticalDistance < 120;

  if (seesPlayer) {
    enemy.aiState = "chase";
  } else {
    enemy.aiState = "patrol";
  }

  if (enemy.aiState !== enemy.lastAIState) {
    if (enemy.aiState === "chase") {
      showEnemyChaseFeedback(scene, enemy);
    } else {
      showEnemyExitChaseFeedback(scene, enemy);
    }
    enemy.lastAIState = enemy.aiState;
  }

  if (enemy.aiState === "chase") {
    enemy.patrolDir = directionToPlayer;
    steerEnemy(scene, enemy, directionToPlayer, ENEMY_CHASE_SPEED);
    enemy.setFlipX(directionToPlayer < 0);

    if (scene.time.now >= enemy.nextFireAt && absDistanceX <= ENEMY_SHOOT_RANGE && verticalDistance < 90) {
      fireEnemyProjectile(scene, enemy, directionToPlayer);
      enemy.nextFireAt = scene.time.now + ENEMY_FIRE_COOLDOWN_MS;
    }

    if ((enemy.body.blocked.left || enemy.body.blocked.right) && enemy.body.blocked.down && scene.time.now >= enemy.nextJumpAt) {
      enemy.setVelocityY(ENEMY_JUMP_VELOCITY);
      enemy.nextJumpAt = scene.time.now + ENEMY_JUMP_COOLDOWN_MS;
    }

    return;
  }

  if (enemy.body.blocked.left) {
    enemy.patrolDir = 1;
  } else if (enemy.body.blocked.right) {
    enemy.patrolDir = -1;
  }

  const frontX = enemy.x + enemy.patrolDir * 14;
  const frontY = enemy.y + enemy.displayHeight * 0.6;
  const hasGroundAhead = worldLayer.hasTileAtWorldXY(frontX, frontY);
  if (enemy.body.blocked.down && !hasGroundAhead) {
    enemy.patrolDir *= -1;
  }

  steerEnemy(scene, enemy, enemy.patrolDir, ENEMY_PATROL_SPEED);
  enemy.setFlipX(enemy.patrolDir < 0);
}

function fireEnemyProjectile(scene, enemy, direction) {
  const projectile = enemyProjectiles.get(enemy.x + direction * 18, enemy.y - 8, "enemyProjectile");
  if (!projectile) {
    return;
  }

  projectile.setActive(true);
  projectile.setVisible(true);
  projectile.body.enable = true;
  projectile.setDepth(5);
  projectile.setCircle(4, 0, 0);
  if (projectile.body) {
    projectile.body.setAllowGravity(false);
    projectile.body.setAccelerationX(direction * PROJECTILE_ACCELERATION_X);
    projectile.body.setMaxVelocity(PROJECTILE_MAX_SPEED, 40);
  }
  projectile.setVelocity(direction * PROJECTILE_INITIAL_SPEED, Phaser.Math.Between(-30, 30));
  projectile.expiresAt = scene.time.now + PROJECTILE_LIFETIME_MS;
}

function fireTurretProjectile(scene, enemy, direction) {
  const projectile = turretProjectiles.get(enemy.x + direction * 18, enemy.y - 8, "enemyProjectile");
  if (!projectile) {
    return;
  }

  projectile.setActive(true);
  projectile.setVisible(true);
  projectile.body.enable = true;
  projectile.setDepth(5);
  projectile.setCircle(4, 0, 0);
  if (projectile.body) {
    projectile.body.setAllowGravity(false);
    projectile.body.setAcceleration(0, 0);
    projectile.body.setVelocity(direction * TURRET_PROJECTILE_SPEED, 0);
    projectile.body.setMaxVelocity(TURRET_PROJECTILE_SPEED, 0);
  }
  projectile.expiresAt = scene.time.now + PROJECTILE_LIFETIME_MS;
}

function dropBomberBomb(scene, enemy) {
  const bomb = enemyBombs.get(enemy.x, enemy.y + 10, "enemyProjectile");
  if (!bomb) {
    return;
  }

  bomb.setActive(true);
  bomb.setVisible(true);
  bomb.body.enable = true;
  bomb.setDepth(5);
  bomb.setScale(1.4);
  bomb.setTint(0xffa6f5);
  bomb.setCircle(4, 0, 0);
  if (bomb.body) {
    bomb.body.setAllowGravity(true);
    bomb.body.setGravityY(BOMB_GRAVITY_Y);
    bomb.body.setBounce(0, BOMB_BOUNCE_Y);
    bomb.body.setAcceleration(0, 0);
    bomb.body.setVelocity(Phaser.Math.Between(-25, 25), 40);
  }
  bomb.expiresAt = scene.time.now + PROJECTILE_LIFETIME_MS;
}

function disableProjectile(projectile) {
  if (projectile.body) {
    projectile.body.setAcceleration(0, 0);
    projectile.body.setVelocity(0, 0);
  }
  projectile.disableBody(true, true);
}

function updateFlyingEnemyAI(scene, enemy) {
  const now = scene.time.now;
  const delta = scene.game.loop.delta;
  const distanceXToPlayer = Math.abs(player.x - enemy.x);
  const playerIsBelow = player.y > enemy.y + 24;

  if (enemy.state === "idle") {
    enemy.setVelocity(0, 0);
    enemy.x = enemy.homeX;
    enemy.y = enemy.homeY + Math.sin(now * FLYING_IDLE_WOBBLE_SPEED + enemy.wobbleOffset) * FLYING_IDLE_WOBBLE_PX;
    enemy.setTint(0x98e6ff);

    const inSoftRange = distanceXToPlayer <= FLYING_ATTACK_TRIGGER_X_SOFT;
    const inHardRange = distanceXToPlayer <= FLYING_ATTACK_TRIGGER_X_HARD;
    const canScanForAttack = now >= enemy.nextAttackAt && playerIsBelow && inSoftRange;

    if (canScanForAttack) {
      enemy.lockOnMs += delta * (inHardRange ? 1.7 : 1);
    } else {
      enemy.lockOnMs -= delta * 1.4;
    }

    enemy.lockOnMs = Phaser.Math.Clamp(enemy.lockOnMs, 0, FLYING_LOCK_ON_MS);

    if (enemy.lockOnMs >= FLYING_LOCK_ON_MS) {
      enemy.state = "windup";
      enemy.windupUntil = now + FLYING_WINDUP_MS;
      enemy.lockOnMs = 0;
      enemy.diveTargetY = Math.min(enemy.homeY + FLYING_MAX_DIVE_DISTANCE, player.y - 10);
    }
    return;
  }

  if (enemy.state === "windup") {
    enemy.setVelocity(0, 0);
    enemy.x = enemy.homeX;
    enemy.y = enemy.homeY + Math.sin(now * 0.018 + enemy.wobbleOffset) * 5;

    const blink = Math.sin(now * 0.06) > 0;
    enemy.setTint(blink ? 0xffb3b3 : 0xff6d6d);

    const lostTarget = distanceXToPlayer > FLYING_ATTACK_TRIGGER_X_SOFT * 1.5 || !playerIsBelow;
    if (lostTarget) {
      enemy.state = "idle";
      enemy.nextAttackAt = now + 420;
      enemy.clearTint();
      return;
    }

    if (now >= enemy.windupUntil) {
      enemy.state = "dive";
      enemy.clearTint();
    }
    return;
  }

  if (enemy.state === "dive") {
    enemy.setVelocityY(FLYING_DIVE_SPEED);
    enemy.setTint(0xff8c8c);
    if (enemy.y >= enemy.diveTargetY || enemy.body.blocked.down) {
      enemy.state = "return";
    }
    return;
  }

  enemy.setVelocityY(-FLYING_RETURN_SPEED);
  enemy.setTint(0x98e6ff);
  if (enemy.y <= enemy.homeY) {
    enemy.y = enemy.homeY;
    enemy.setVelocityY(0);
    enemy.state = "idle";
    enemy.nextAttackAt = now + FLYING_ATTACK_COOLDOWN_MS;
  }
}

function updateChargerEnemyAI(scene, enemy) {
  const now = scene.time.now;
  const distanceX = player.x - enemy.x;
  const absDistanceX = Math.abs(distanceX);
  const absDistanceY = Math.abs(player.y - enemy.y);
  const dirToPlayer = distanceX >= 0 ? 1 : -1;

  if (enemy.state === "windup") {
    enemy.setVelocityX(0);
    enemy.setTint(0xff8f4a);
    if (now >= enemy.windupUntil) {
      enemy.state = "charge";
      enemy.dir = dirToPlayer;
      enemy.setVelocityX(enemy.dir * CHARGER_CHARGE_SPEED);
    }
    return;
  }

  if (enemy.state === "charge") {
    enemy.setTint(0xff7043);
    enemy.setVelocityX(enemy.dir * CHARGER_CHARGE_SPEED);
    if (enemy.body.blocked.left || enemy.body.blocked.right) {
      enemy.state = "cooldown";
      enemy.cooldownUntil = now + CHARGER_COOLDOWN_MS;
      enemy.dir *= -1;
      enemy.setVelocityX(0);
      enemy.setTint(0xffb36b);
    }
    return;
  }

  if (enemy.state === "cooldown") {
    enemy.setVelocityX(0);
    enemy.setTint(0xffb36b);
    if (now >= enemy.cooldownUntil) {
      enemy.state = "patrol";
    }
    return;
  }

  if (enemy.body.blocked.left) {
    enemy.dir = 1;
  } else if (enemy.body.blocked.right) {
    enemy.dir = -1;
  }

  enemy.setVelocityX(enemy.dir * CHARGER_PATROL_SPEED);
  enemy.setFlipX(enemy.dir < 0);
  enemy.setTint(0xffb36b);

  const canCharge = now >= enemy.cooldownUntil && absDistanceX <= CHARGER_TRIGGER_RANGE_X && absDistanceY <= CHARGER_TRIGGER_RANGE_Y;
  if (canCharge) {
    enemy.state = "windup";
    enemy.windupUntil = now + CHARGER_WINDUP_MS;
    enemy.setVelocityX(0);
  }
}

function updateTurretEnemyAI(scene, enemy) {
  const now = scene.time.now;
  const distanceX = player.x - enemy.x;
  const absDistanceX = Math.abs(distanceX);
  const absDistanceY = Math.abs(player.y - enemy.y);
  const direction = distanceX >= 0 ? 1 : -1;

  enemy.setFlipX(direction < 0);

  const canFire = now >= enemy.nextFireAt && absDistanceX <= TURRET_FIRE_RANGE_X && absDistanceY <= TURRET_AIM_RANGE_Y;
  if (canFire) {
    fireTurretProjectile(scene, enemy, direction);
    enemy.nextFireAt = now + TURRET_FIRE_COOLDOWN_MS;
  }
}

function updateBomberEnemyAI(scene, enemy) {
  const now = scene.time.now;
  const distanceXToPlayer = Math.abs(player.x - enemy.x);

  if (enemy.state === "hover") {
    enemy.setVelocity(0, 0);
    enemy.x = enemy.homeX;
    enemy.y = enemy.homeY + Math.sin(now * 0.0025 + enemy.wobbleOffset) * 10;
    enemy.setTint(0xd6a9ff);

    const readyToDrop = now >= enemy.nextDropAt && distanceXToPlayer <= BOMBER_TRIGGER_RANGE_X && player.y > enemy.y + 24;
    if (readyToDrop) {
      enemy.state = "windup";
      enemy.windupUntil = now + BOMBER_DROP_WINDUP_MS;
    }
    return;
  }

  if (enemy.state === "windup") {
    enemy.setVelocity(0, 0);
    enemy.setTint(0xffb3ff);
    if (now >= enemy.windupUntil) {
      dropBomberBomb(scene, enemy);
      enemy.state = "hover";
      enemy.nextDropAt = now + BOMBER_COOLDOWN_MS;
      enemy.setTint(0xd6a9ff);
    }
  }
}

function showEnemyChaseFeedback(scene, enemy) {
  if (enemy.chaseBadge) {
    enemy.chaseBadge.setText("!").setVisible(true).setAlpha(1).setScale(1);
    enemy.chaseBadge.y = enemy.y - 32;
  }

  if (enemy.chaseBadgeTween) {
    enemy.chaseBadgeTween.stop();
  }

  enemy.chaseBadgeTween = scene.tweens.add({
    targets: enemy.chaseBadge,
    y: enemy.y - 35,
    alpha: 0.7,
    duration: 260,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut"
  });

  if (enemy.alertText) {
    enemy.alertText.destroy();
  }

  const alertText = scene.add.text(enemy.x, enemy.y - 26, "!", {
    fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
    fontSize: "18px",
    color: "#ffeb3b",
    stroke: "#3a1c00",
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(7);

  enemy.alertText = alertText;

  scene.tweens.add({
    targets: alertText,
    y: enemy.y - 44,
    alpha: 0,
    duration: 350,
    ease: "Quad.easeOut",
    onComplete: () => {
      alertText.destroy();
      if (enemy.alertText === alertText) {
        enemy.alertText = null;
      }
    }
  });
}

function showEnemyExitChaseFeedback(scene, enemy) {
  enemy.clearTint();

  if (enemy.chaseBadgeTween) {
    enemy.chaseBadgeTween.stop();
    enemy.chaseBadgeTween = null;
  }
  if (enemy.chaseBadge) {
    enemy.chaseBadge.setVisible(false).setAlpha(1).setScale(1);
  }

  if (enemy.alertText) {
    enemy.alertText.destroy();
  }

  const alertText = scene.add.text(enemy.x, enemy.y - 26, "?", {
    fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
    fontSize: "18px",
    color: "#9be7ff",
    stroke: "#0f2f44",
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(7);

  enemy.alertText = alertText;

  scene.tweens.add({
    targets: alertText,
    y: enemy.y - 44,
    alpha: 0,
    duration: 320,
    ease: "Quad.easeOut",
    onComplete: () => {
      alertText.destroy();
      if (enemy.alertText === alertText) {
        enemy.alertText = null;
      }
    }
  });
}

function updateEnemyVisualFeedback(scene, enemy) {
  if (enemy.chaseBadge && enemy.chaseBadge.visible) {
    enemy.chaseBadge.x = enemy.x;
    if (!enemy.chaseBadgeTween) {
      enemy.chaseBadge.y = enemy.y - 34;
    }
  }

  if (enemy.aiState === "chase") {
    const pulse = (Math.sin(scene.time.now * 0.02) + 1) * 0.5;
    const gb = Math.floor(140 + pulse * 85);
    enemy.setTint(Phaser.Display.Color.GetColor(255, gb, gb));
  } else {
    enemy.clearTint();
  }
}

function cleanupEnemyFeedback(enemy) {
  if (enemy.chaseBadgeTween) {
    enemy.chaseBadgeTween.stop();
    enemy.chaseBadgeTween = null;
  }
  if (enemy.chaseBadge) {
    enemy.chaseBadge.destroy();
    enemy.chaseBadge = null;
  }
  if (enemy.alertText) {
    enemy.alertText.destroy();
    enemy.alertText = null;
  }
}

function steerEnemy(scene, enemy, direction, maxSpeed) {
  if (enemy.desiredDir !== direction) {
    enemy.desiredDir = direction;
    enemy.turnLockUntil = scene.time.now + ENEMY_TURN_DELAY_MS;
  }

  enemy.setMaxVelocity(maxSpeed, 1200);

  if (scene.time.now < enemy.turnLockUntil) {
    enemy.setDragX(ENEMY_TURN_DRAG_X);
    enemy.setAccelerationX(0);
    return;
  }

  enemy.setDragX(ENEMY_DRAG_X);
  enemy.setAccelerationX(direction * ENEMY_ACCELERATION);
}

function createStarTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffd54f, 1);
  g.fillCircle(8, 8, 8);
  g.lineStyle(2, 0xff9800, 1);
  g.strokeCircle(8, 8, 8);
  g.generateTexture("star", 16, 16);
  g.destroy();
}

function createEnemyProjectileTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xff764a, 1);
  g.fillCircle(4, 4, 4);
  g.lineStyle(1, 0xffffff, 0.8);
  g.strokeCircle(4, 4, 4);
  g.generateTexture("enemyProjectile", 8, 8);
  g.destroy();
}

function createAttackHitboxTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 0.001);
  g.fillRect(0, 0, 34, 24);
  g.generateTexture("attackHitbox", 34, 24);
  g.destroy();
}

function createPlayerAnimations(scene) {
  scene.anims.create({
    key: "player-idle",
    frames: scene.anims.generateFrameNumbers("player", { frames: [0, 4] }),
    frameRate: 2,
    repeat: -1
  });

  scene.anims.create({
    key: "player-run",
    frames: scene.anims.generateFrameNumbers("player", { frames: [1, 2] }),
    frameRate: 10,
    repeat: -1
  });

  scene.anims.create({
    key: "player-jump",
    frames: scene.anims.generateFrameNumbers("player", { frames: [3] }),
    frameRate: 1,
    repeat: -1
  });

  scene.anims.create({
    key: "player-attack",
    frames: scene.anims.generateFrameNumbers("player", { frames: [5, 6] }),
    frameRate: 16,
    repeat: -1
  });
}

function createRuntimeTilesetTexture(scene) {
  if (scene.textures.exists("tilePlatformRuntime")) {
    return;
  }

  const width = (MAX_RUNTIME_TILE_ID + 1) * TILE_SIZE;
  const canvasTexture = scene.textures.createCanvas("tilePlatformRuntime", width, TILE_SIZE);
  const ctx = canvasTexture.getContext();
  const atlasTexture = scene.textures.get("tileAtlasDefault");
  const source = atlasTexture.getSourceImage();

  for (let i = 0; i <= MAX_RUNTIME_TILE_ID; i += 1) {
    const frame = TILE_RUNTIME_META.runtimeFrames[i];
    if (!frame) {
      continue;
    }

    const x = i * TILE_SIZE;
    const tile = frame.tile;
    const tx = Number.isInteger(frame.tx) ? frame.tx : (Number.isInteger(tile.tx) ? tile.tx : tile.id);
    const ty = Number.isInteger(frame.ty) ? frame.ty : (Number.isInteger(tile.ty) ? tile.ty : 0);
    const sx = tx * TILESET_ATLAS_TILE_SIZE;
    const sy = ty * TILESET_ATLAS_TILE_SIZE;
    const validCoords =
      sx >= 0 &&
      sy >= 0 &&
      sx + TILESET_ATLAS_TILE_SIZE <= source.width &&
      sy + TILESET_ATLAS_TILE_SIZE <= source.height;

    if (validCoords) {
      ctx.globalAlpha = tile.solid ? 1 : 0.6;
      ctx.drawImage(
        source,
        sx,
        sy,
        TILESET_ATLAS_TILE_SIZE,
        TILESET_ATLAS_TILE_SIZE,
        x,
        0,
        TILE_SIZE,
        TILE_SIZE
      );
      ctx.globalAlpha = 1;
      continue;
    }

    const base = hexToInt(tile.color, 0x7ebc56);
    const dark = darkenColor(base, 0.2);
    const light = lightenColor(base, 0.18);
    ctx.globalAlpha = tile.solid ? 1 : 0.55;
    ctx.fillStyle = `#${base.toString(16).padStart(6, "0")}`;
    ctx.fillRect(x, 0, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = `#${light.toString(16).padStart(6, "0")}`;
    ctx.fillRect(x, 6, TILE_SIZE, 3);
    ctx.fillStyle = `#${dark.toString(16).padStart(6, "0")}`;
    ctx.fillRect(x, TILE_SIZE - 8, TILE_SIZE, 8);
    ctx.globalAlpha = 1;
  }

  canvasTexture.refresh();
}

function parseAnimationFrames(value, fallbackTx, fallbackTy) {
  if (!Array.isArray(value)) {
    return [{ tx: fallbackTx, ty: fallbackTy }];
  }

  const frames = value
    .map((frame) => {
      if (!frame || typeof frame !== "object") {
        return null;
      }
      const tx = Math.round(Number(frame.tx));
      const ty = Math.round(Number(frame.ty));
      if (!Number.isInteger(tx) || !Number.isInteger(ty) || tx < 0 || ty < 0) {
        return null;
      }
      return { tx, ty };
    })
    .filter((item) => item !== null);

  if (!frames.length) {
    return [{ tx: fallbackTx, ty: fallbackTy }];
  }
  return frames;
}

function buildTileRuntimeMeta(tileDefs) {
  const runtimeFrames = [];
  const runtimeToBaseMap = new Map();
  const solidRuntimeTileIds = new Set();
  const animatedGroups = [];
  const maxBaseId = tileDefs.reduce((max, tile) => Math.max(max, tile.id), 0);
  let nextRuntimeId = maxBaseId + 1;

  tileDefs
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach((tile) => {
      const baseTx = Number.isInteger(tile.tx) ? tile.tx : tile.id;
      const baseTy = Number.isInteger(tile.ty) ? tile.ty : 0;
      const frames = tile.animated
        ? parseAnimationFrames(tile.animationFrames, baseTx, baseTy)
        : [{ tx: baseTx, ty: baseTy }];
      const runtimeIds = [];

      frames.forEach((frame, frameIndex) => {
        const runtimeId = frameIndex === 0 ? tile.id : nextRuntimeId++;
        runtimeFrames[runtimeId] = { tile, tx: frame.tx, ty: frame.ty };
        runtimeToBaseMap.set(runtimeId, tile.id);
        runtimeIds.push(runtimeId);
        if (tile.solid) {
          solidRuntimeTileIds.add(runtimeId);
        }
      });

      if (tile.animated && runtimeIds.length > 1) {
        animatedGroups.push({
          baseTileId: tile.id,
          runtimeIds,
          frameMs: Math.max(60, Math.round(Number(tile.animationMs) || TILE_ANIMATION_FRAME_MS))
        });
      }
    });

  return {
    runtimeFrames,
    runtimeToBaseMap,
    solidRuntimeTileIds,
    animatedGroups,
    maxRuntimeTileId: Math.max(maxBaseId, nextRuntimeId - 1)
  };
}

function initializeAnimatedTiles(layer) {
  if (!layer || !ANIMATED_TILE_GROUPS.length) {
    return null;
  }

  const groups = ANIMATED_TILE_GROUPS
    .map((group) => {
      const positions = [];
      layer.forEachTile((tile) => {
        if (tile && tile.index === group.baseTileId) {
          positions.push({ x: tile.x, y: tile.y });
        }
      });
      if (!positions.length) {
        return null;
      }
      return {
        ...group,
        positions,
        frameIndex: 0,
        nextAt: 0
      };
    })
    .filter((group) => group !== null);

  if (!groups.length) {
    return null;
  }

  return { groups };
}

function updateAnimatedTiles(scene) {
  if (!scene || !animatedTileState || !worldLayer) {
    return;
  }

  const now = scene.time.now;
  animatedTileState.groups.forEach((group) => {
    if (group.nextAt === 0) {
      group.nextAt = now + group.frameMs;
      return;
    }
    if (now < group.nextAt) {
      return;
    }

    group.frameIndex = (group.frameIndex + 1) % group.runtimeIds.length;
    const runtimeId = group.runtimeIds[group.frameIndex];
    group.positions.forEach((pos) => {
      worldLayer.putTileAt(runtimeId, pos.x, pos.y);
    });
    group.nextAt = now + group.frameMs;
  });
}

function createParallaxLayer(scene, textureKey, worldWidth, worldHeight, parallaxAnchor, scrollFactorX, scrollFactorY, depth, options = {}) {
  const texture = scene.textures.get(textureKey);
  const source = texture.getSourceImage();
  const sourceWidth = source.width || 1;
  const sourceHeight = source.height || 1;
  const scale = GAME_HEIGHT / sourceHeight;
  const layerWidth = sourceWidth * scale;
  const layerHeight = sourceHeight * scale;
  const maxCameraScrollY = Math.max(0, worldHeight - GAME_HEIGHT);
  const anchorY = parallaxAnchor === PARALLAX_ANCHOR_BOTTOM
    ? GAME_HEIGHT - layerHeight + maxCameraScrollY * scrollFactorY
    : 0;
  const requiredWidth = worldWidth * scrollFactorX + GAME_WIDTH + layerWidth * 4;
  const copies = Math.max(4, Math.ceil(requiredWidth / layerWidth));
  const startX = -layerWidth * 2;
  const sprites = [];

  for (let i = 0; i < copies; i += 1) {
    const image = scene.add.image(startX + i * layerWidth, anchorY, textureKey)
      .setOrigin(0, 0)
      .setScale(scale)
      .setScrollFactor(scrollFactorX, scrollFactorY)
      .setDepth(depth);
    if (typeof options.alpha === "number") {
      image.setAlpha(options.alpha);
    }
    if (typeof options.tint === "number") {
      image.setTint(options.tint);
    }
    sprites.push(image);
  }

  return { sprites, scrollFactorX, scrollFactorY };
}

function createDecorSupportLayer(scene, decorLayer) {
  if (!decorLayer || !decorLayer.image) {
    return;
  }

  const textureKey = `decor_${hashString(decorLayer.image)}`;
  const spawn = () => {
    if (decorLayerSprite) {
      decorLayerSprite.destroy();
      decorLayerSprite = null;
    }
    decorLayerSprite = scene.add.image(decorLayer.x, decorLayer.y, textureKey)
      .setOrigin(0, 0)
      .setScrollFactor(1, 1)
      .setDepth(decorLayer.depth);
    decorLayerSprite.setScale(decorLayer.scale);
    decorLayerSprite.setAlpha(decorLayer.alpha);
  };

  if (scene.textures.exists(textureKey)) {
    spawn();
    return;
  }

  scene.load.image(textureKey, decorLayer.image);
  scene.load.once("complete", () => {
    if (!scene.sys.isActive()) {
      return;
    }
    if (scene.textures.exists(textureKey)) {
      spawn();
    }
  });
  scene.load.start();
}

function buildLevelData() {
  const rows = Array.from({ length: WORLD_HEIGHT_TILES }, () => Array(WORLD_WIDTH_TILES).fill(-1));

  for (let x = 0; x < WORLD_WIDTH_TILES; x += 1) {
    rows[16][x] = 0;
  }

  addPlatform(rows, 13, 6, 14);
  addPlatform(rows, 12, 18, 23);
  addPlatform(rows, 11, 28, 36);
  addPlatform(rows, 9, 40, 46);
  addPlatform(rows, 13, 50, 58);
  addPlatform(rows, 10, 62, 67);
  addPlatform(rows, 8, 73, 78);
  addPlatform(rows, 12, 82, 88);
  addPlatform(rows, 9, 92, 97);
  addPlatform(rows, 11, 102, 109);

  addColumn(rows, 15, 15, 2);
  addColumn(rows, 33, 14, 3);
  addColumn(rows, 56, 15, 2);
  addColumn(rows, 84, 14, 3);

  return rows;
}

function getLevelConfig() {
  const entrySide = localStorage.getItem(LEVEL_ENTRY_SIDE_KEY);
  localStorage.removeItem(LEVEL_ENTRY_SIDE_KEY);
  const fallbackData = buildLevelData();
  const fallbackWorldWidth = fallbackData[0].length * TILE_SIZE;
  const fallback = {
    data: fallbackData,
    playerSpawn: { ...DEFAULT_PLAYER_SPAWN },
    entrySpawnFromLeft: null,
    entrySpawnFromRight: null,
    decorLayer: null,
    enemySpawns: clampDefaultSpawnArray(DEFAULT_GROUND_ENEMIES, fallbackWorldWidth, 60),
    flyingSpawns: clampDefaultPointArray(DEFAULT_FLYING_ENEMIES, fallbackWorldWidth),
    chargerSpawns: clampDefaultSpawnArray(DEFAULT_CHARGERS, fallbackWorldWidth, 60),
    turretSpawns: clampDefaultSpawnArray(DEFAULT_TURRETS, fallbackWorldWidth, 60),
    bomberSpawns: clampDefaultPointArray(DEFAULT_BOMBERS, fallbackWorldWidth),
    parallaxFiles: getDefaultParallaxFiles(),
    bgmFile: BGM_DEFAULT_FILE,
    parallaxAnchor: PARALLAX_ANCHOR_TOP,
    levelName: "Nivel Base",
    levelIndex: 0,
    levelCount: 1,
    levelId: null,
    levelIds: []
  };

  try {
    const campaignRaw = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (campaignRaw) {
      const campaignParsed = JSON.parse(campaignRaw);
      const levels = Array.isArray(campaignParsed?.levels) ? campaignParsed.levels : [];
      const validLevels = levels
        .map((lvl, idx) => ({
          id: lvl?.id || `level_${idx + 1}`,
          name: lvl?.name || `Nivel ${idx + 1}`,
          payload: lvl?.payload
        }))
        .filter((lvl) => lvl.payload && typeof lvl.payload === "object");

      if (validLevels.length) {
        let idx = Number(localStorage.getItem(LEVEL_INDEX_STORAGE_KEY));
        if (!Number.isInteger(idx) || idx < 0 || idx >= validLevels.length) {
          const activeId = campaignParsed?.activeId;
          const activeIndex = validLevels.findIndex((lvl) => lvl.id === activeId);
          idx = activeIndex >= 0 ? activeIndex : 0;
        }

        const selected = validLevels[idx];
        const normalized = normalizeLevelPayload(selected.payload, fallback);
        if (normalized) {
          const playerSpawn = resolveEntryPlayerSpawn(normalized, entrySide);
          return {
            ...normalized,
            playerSpawn,
            levelName: selected.name,
            levelIndex: idx,
            levelCount: validLevels.length,
            levelId: selected.id,
            levelIds: validLevels.map((lvl) => lvl.id)
          };
        }
      }
    }

    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const normalized = normalizeLevelPayload(parsed, fallback);
    if (!normalized) {
      return fallback;
    }
    const playerSpawn = resolveEntryPlayerSpawn(normalized, entrySide);
    return {
      ...normalized,
      playerSpawn,
      levelName: "Nivel Activo",
      levelIndex: 0,
      levelCount: 1,
      levelId: null,
      levelIds: []
    };
  } catch {
    return fallback;
  }
}

function normalizeLevelPayload(parsed, fallback) {
  const data = Array.isArray(parsed) ? parsed : parsed?.data;

  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  const cols = Array.isArray(data[0]) ? data[0].length : 0;
  if (cols < 8) {
    return null;
  }

  const normalized = data.map((row) => {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error("invalid level shape");
    }
    return row.map((cell) => normalizeTileValue(cell));
  });

  const worldWidth = cols * TILE_SIZE;
  const worldHeight = data.length * TILE_SIZE;
  const playerSpawn = normalizePoint(parsed.playerSpawn, fallback.playerSpawn, worldWidth);
  const entrySpawnFromLeft = normalizePoint(parsed.entrySpawnFromLeft, null, worldWidth);
  const entrySpawnFromRight = normalizePoint(parsed.entrySpawnFromRight, null, worldWidth);
  const decorLayer = normalizeDecorLayer(parsed?.decorLayer, worldWidth, worldHeight);
  const enemySpawns = normalizeSpawnArray(parsed.enemySpawns, clampDefaultSpawnArray(DEFAULT_GROUND_ENEMIES, worldWidth, 60), worldWidth, 60);
  const flyingSpawns = normalizePointArray(parsed.flyingSpawns, clampDefaultPointArray(DEFAULT_FLYING_ENEMIES, worldWidth), worldWidth);
  const chargerSpawns = normalizeSpawnArray(parsed.chargerSpawns, clampDefaultSpawnArray(DEFAULT_CHARGERS, worldWidth, 60), worldWidth, 60);
  const turretSpawns = normalizeSpawnArray(parsed.turretSpawns, clampDefaultSpawnArray(DEFAULT_TURRETS, worldWidth, 60), worldWidth, 60);
  const bomberSpawns = normalizePointArray(parsed.bomberSpawns, clampDefaultPointArray(DEFAULT_BOMBERS, worldWidth), worldWidth);
  const parallaxFiles = normalizeParallaxFiles(parsed?.parallaxFiles, fallback.parallaxFiles);
  const bgmFile = normalizeBgmFile(parsed?.bgmFile, fallback.bgmFile);

  return {
    data: normalized,
    playerSpawn,
    entrySpawnFromLeft,
    entrySpawnFromRight,
    decorLayer,
    parallaxFiles,
    bgmFile,
    parallaxAnchor: parsed?.parallaxAnchor === PARALLAX_ANCHOR_BOTTOM ? PARALLAX_ANCHOR_BOTTOM : PARALLAX_ANCHOR_TOP,
    enemySpawns,
    flyingSpawns,
    chargerSpawns,
    turretSpawns,
    bomberSpawns
  };
}

function resolveEntryPlayerSpawn(level, entrySide) {
  if (entrySide === "left" && level.entrySpawnFromLeft) {
    return { ...level.entrySpawnFromLeft };
  }
  if (entrySide === "right" && level.entrySpawnFromRight) {
    return { ...level.entrySpawnFromRight };
  }
  return { ...level.playerSpawn };
}

function changeLevel(scene, delta) {
  if (transitioningLevel) {
    return;
  }
  const hasCampaign = currentLevelCount > 1;
  if (!hasCampaign) {
    return;
  }

  const nextIndex = Phaser.Math.Wrap(currentLevelIndex + delta, 0, currentLevelCount);
  const nextLevelId = currentLevelIds[nextIndex];
  const entrySide = delta > 0 ? "left" : "right";
  localStorage.setItem(LEVEL_INDEX_STORAGE_KEY, String(nextIndex));
  localStorage.setItem(LEVEL_ENTRY_SIDE_KEY, entrySide);
  if (nextLevelId) {
    localStorage.setItem(ACTIVE_LEVEL_ID_KEY, nextLevelId);
  }

  transitioningLevel = true;
  if (scene?.cameras?.main) {
    scene.cameras.main.fadeOut(LEVEL_VISUAL_FADE_MS, 0, 0, 0);
  }
  fadeOutBgmAndRestart(scene);
}

function fadeInBgm(scene) {
  if (!scene || !scene.tweens || !bgmTrack) {
    if (bgmTrack) {
      bgmTrack.setVolume(BGM_DEFAULT_VOLUME);
    }
    return;
  }

  scene.tweens.killTweensOf(bgmTrack);
  const driver = { v: 0 };
  scene.tweens.add({
    targets: driver,
    v: BGM_DEFAULT_VOLUME,
    duration: BGM_LEVEL_FADE_MS,
    ease: "Sine.easeInOut",
    onUpdate: () => {
      if (bgmTrack) {
        bgmTrack.setVolume(Math.max(0, driver.v));
      }
    }
  });
}

function fadeOutBgmAndRestart(scene) {
  if (!scene || !scene.tweens || !bgmTrack || !bgmTrack.isPlaying) {
    scene.scene.restart();
    return;
  }

  scene.tweens.killTweensOf(bgmTrack);
  const driver = { v: bgmTrack.volume };
  scene.tweens.add({
    targets: driver,
    v: 0,
    duration: BGM_LEVEL_FADE_MS,
    ease: "Sine.easeInOut",
    onUpdate: () => {
      if (bgmTrack) {
        bgmTrack.setVolume(Math.max(0, driver.v));
      }
    },
    onComplete: () => {
      if (bgmTrack) {
        bgmTrack.stop();
      }
      scene.time.delayedCall(BGM_LEVEL_SWITCH_GAP_MS, () => {
        scene.scene.restart();
      });
    }
  });
}

function normalizeXArray(value, fallback, worldWidth) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const safe = value
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= worldWidth);
  return safe;
}

function normalizeSpawnArray(value, fallback, worldWidth, defaultY) {
  if (!Array.isArray(value)) {
    return fallback.map((s) => ({ ...s }));
  }

  const safe = value
    .map((item) => {
      if (typeof item === "number") {
        const x = Number(item);
        return Number.isFinite(x) && x >= 0 && x <= worldWidth ? { x, y: defaultY } : null;
      }
      if (!item || typeof item !== "object") {
        return null;
      }
      const x = Number(item.x);
      const y = Number(item.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > worldWidth) {
        return null;
      }
      return { x, y };
    })
    .filter((s) => s !== null);

  return safe;
}

function normalizePointArray(value, fallback, worldWidth) {
  if (!Array.isArray(value)) {
    return fallback.map((s) => ({ ...s }));
  }
  const safe = value
    .map((item) => normalizePoint(item, null, worldWidth))
    .filter((item) => item !== null);
  return safe;
}

function normalizePoint(value, fallback, worldWidth) {
  if (!value || typeof value !== "object") {
    return fallback ? { ...fallback } : null;
  }
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > worldWidth) {
    return fallback ? { ...fallback } : null;
  }
  return { x, y };
}

function getDefaultParallaxFiles() {
  return {
    sky: PARALLAX_BG_SKY_DEFAULT,
    far: PARALLAX_BG_FAR_DEFAULT,
    mid: PARALLAX_BG_MID_DEFAULT
  };
}

function normalizeParallaxFiles(value, fallback) {
  const base = fallback || getDefaultParallaxFiles();
  if (!value || typeof value !== "object") {
    return { ...base };
  }

  const safePath = (candidate, fallbackPath) => {
    if (typeof candidate !== "string") {
      return fallbackPath;
    }
    const trimmed = candidate.trim();
    return trimmed || fallbackPath;
  };

  return {
    sky: safePath(value.sky, base.sky),
    far: safePath(value.far, base.far),
    mid: safePath(value.mid, base.mid)
  };
}

function normalizeBgmFile(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function preloadParallaxTexture(scene, slot, filePath) {
  const defaults = getDefaultParallaxFiles();
  const defaultPathBySlot = {
    sky: defaults.sky,
    far: defaults.far,
    mid: defaults.mid
  };
  if (!filePath || filePath === defaultPathBySlot[slot]) {
    return;
  }

  const key = getParallaxTextureKey(slot, filePath);
  if (!scene.textures.exists(key)) {
    scene.load.image(key, filePath);
  }
}

function preloadBgmAudio(scene, filePath) {
  if (!filePath || filePath === BGM_DEFAULT_FILE) {
    return;
  }
  const key = getBgmAudioKey(filePath);
  if (!scene.cache.audio.exists(key)) {
    scene.load.audio(key, filePath);
  }
}

function getParallaxTextureKey(slot, filePath) {
  return `parallax_${slot}_${hashString(filePath)}`;
}

function getBgmAudioKey(filePath) {
  return `bgm_${hashString(filePath)}`;
}

function getParallaxTextureKeysForLevel(scene, files) {
  const defaults = getDefaultParallaxFiles();
  const normalizedFiles = normalizeParallaxFiles(files, defaults);

  const resolve = (slot, path, defaultKey) => {
    if (path === defaults[slot]) {
      return defaultKey;
    }
    const customKey = getParallaxTextureKey(slot, path);
    return scene.textures.exists(customKey) ? customKey : defaultKey;
  };

  return {
    sky: resolve("sky", normalizedFiles.sky, "bgSkyDefault"),
    far: resolve("far", normalizedFiles.far, "bgFarDefault"),
    mid: resolve("mid", normalizedFiles.mid, "bgMidDefault")
  };
}

function getBgmAudioKeyForLevel(scene, filePath) {
  const normalized = normalizeBgmFile(filePath, BGM_DEFAULT_FILE);
  if (normalized === BGM_DEFAULT_FILE) {
    return "bgmDefault";
  }
  const customKey = getBgmAudioKey(normalized);
  return scene.cache.audio.exists(customKey) ? customKey : "bgmDefault";
}

function getPreloadParallaxFiles() {
  const defaults = getDefaultParallaxFiles();

  try {
    const campaignRaw = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (campaignRaw) {
      const campaignParsed = JSON.parse(campaignRaw);
      const levels = Array.isArray(campaignParsed?.levels) ? campaignParsed.levels : [];
      const validLevels = levels
        .map((lvl, idx) => ({
          id: lvl?.id || `level_${idx + 1}`,
          payload: lvl?.payload
        }))
        .filter((lvl) => lvl.payload && typeof lvl.payload === "object");

      if (validLevels.length) {
        let idx = Number(localStorage.getItem(LEVEL_INDEX_STORAGE_KEY));
        if (!Number.isInteger(idx) || idx < 0 || idx >= validLevels.length) {
          const activeId = campaignParsed?.activeId;
          const activeIndex = validLevels.findIndex((lvl) => lvl.id === activeId);
          idx = activeIndex >= 0 ? activeIndex : 0;
        }
        return normalizeParallaxFiles(validLevels[idx]?.payload?.parallaxFiles, defaults);
      }
    }

    const levelRaw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (levelRaw) {
      const parsed = JSON.parse(levelRaw);
      return normalizeParallaxFiles(parsed?.parallaxFiles, defaults);
    }
  } catch {
    return defaults;
  }

  return defaults;
}

function getPreloadBgmFile() {
  try {
    const campaignRaw = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (campaignRaw) {
      const campaignParsed = JSON.parse(campaignRaw);
      const levels = Array.isArray(campaignParsed?.levels) ? campaignParsed.levels : [];
      const validLevels = levels
        .map((lvl, idx) => ({
          id: lvl?.id || `level_${idx + 1}`,
          payload: lvl?.payload
        }))
        .filter((lvl) => lvl.payload && typeof lvl.payload === "object");

      if (validLevels.length) {
        let idx = Number(localStorage.getItem(LEVEL_INDEX_STORAGE_KEY));
        if (!Number.isInteger(idx) || idx < 0 || idx >= validLevels.length) {
          const activeId = campaignParsed?.activeId;
          const activeIndex = validLevels.findIndex((lvl) => lvl.id === activeId);
          idx = activeIndex >= 0 ? activeIndex : 0;
        }
        return normalizeBgmFile(validLevels[idx]?.payload?.bgmFile, BGM_DEFAULT_FILE);
      }
    }

    const levelRaw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (levelRaw) {
      const parsed = JSON.parse(levelRaw);
      return normalizeBgmFile(parsed?.bgmFile, BGM_DEFAULT_FILE);
    }
  } catch {
    return BGM_DEFAULT_FILE;
  }

  return BGM_DEFAULT_FILE;
}

function normalizeDecorLayer(value, worldWidth, worldHeight) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const image = typeof value.image === "string" ? value.image.trim() : "";
  if (!image) {
    return null;
  }

  return {
    image,
    x: toNumberInRange(value.x, 0, 0, worldWidth),
    y: toNumberInRange(value.y, 0, 0, worldHeight),
    scale: toNumberInRange(value.scale, 1, 0.1, 8),
    alpha: toNumberInRange(value.alpha, 1, 0, 1),
    depth: toNumberInRange(value.depth, 2.6, -10, 20)
  };
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function clampDefaultXArray(source, worldWidth) {
  return source.filter((x) => x >= 0 && x <= worldWidth);
}

function clampDefaultSpawnArray(source, worldWidth, defaultY) {
  return source
    .filter((x) => x >= 0 && x <= worldWidth)
    .map((x) => ({ x, y: defaultY }));
}

function clampDefaultPointArray(source, worldWidth) {
  return source.filter((p) => p.x >= 0 && p.x <= worldWidth).map((p) => ({ ...p }));
}

function normalizeTileValue(cell) {
  const value = Number(cell);
  if (Number.isInteger(value) && value >= 0 && value <= MAX_TILE_ID) {
    return value;
  }
  return -1;
}

function loadTileDefinitions() {
  const defaults = [
    { id: 0, name: "Piso", color: "#7ebc56", tx: 0, ty: 0, solid: true, slippery: false, breakable: false },
    { id: 1, name: "Bloque rompible", color: "#8f7a66", tx: 1, ty: 0, solid: true, slippery: false, breakable: true },
    { id: 2, name: "Piso resbaladizo", color: "#6d8ba9", tx: 2, ty: 0, solid: true, slippery: true, breakable: false },
    { id: 3, name: "Atravesable", color: "#b88ad1", tx: 3, ty: 0, solid: false, slippery: false, breakable: false },
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
      animationMs: TILE_ANIMATION_FRAME_MS,
      animationFrames: [{ tx: 4, ty: 0 }, { tx: 5, ty: 0 }, { tx: 6, ty: 0 }, { tx: 7, ty: 0 }]
    }
  ];

  try {
    const raw = localStorage.getItem(TILE_DEFS_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return defaults;
    }

    const safe = parsed
      .map((item) => ({
        id: Math.round(Number(item?.id)),
        name: typeof item?.name === "string" ? item.name : "",
        color: typeof item?.color === "string" ? item.color : "#7ebc56",
        tx: Math.round(Number(item?.tx)),
        ty: Math.round(Number(item?.ty)),
        solid: Boolean(item?.solid),
        slippery: Boolean(item?.slippery),
        breakable: Boolean(item?.breakable),
        animated: Boolean(item?.animated),
        animationMs: Math.max(60, Math.round(Number(item?.animationMs) || TILE_ANIMATION_FRAME_MS)),
        animationFrames: parseAnimationFrames(item?.animationFrames, Math.round(Number(item?.tx)), Math.round(Number(item?.ty)))
      }))
      .filter((item) => Number.isInteger(item.id) && item.id >= 0)
      .sort((a, b) => a.id - b.id);

    if (!safe.length) {
      return defaults;
    }

    const hasCore0 = safe.some((item) => item.id === 0);
    if (!hasCore0) {
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

function hexToInt(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const clean = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return fallback;
  }
  return parseInt(clean, 16);
}

function lightenColor(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (channel) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

function darkenColor(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (channel) => Math.max(0, Math.round(channel * (1 - amount)));
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

function addPlatform(rows, row, startX, endX) {
  for (let x = startX; x <= endX; x += 1) {
    rows[row][x] = 0;
  }
}

function addColumn(rows, x, startRow, height) {
  for (let i = 0; i < height; i += 1) {
    rows[startRow - i][x] = 0;
  }
}

