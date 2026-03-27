const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;
const TILE_SIZE = 32;
const WORLD_WIDTH_TILES = 120;
const WORLD_HEIGHT_TILES = 17;
const LEVEL_STORAGE_KEY = "microgame_level_v1";
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
const PLAYER_ATTACK_SCORE = 25;
const PLAYER_DEFAULT_LIVES = 3;
const PLAYER_PARAMS = loadPlayerParams();
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

new Phaser.Game(config);

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
let bgSky;
let bgMountains;
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

function preload() {
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
  this.load.image("tileGrass", "./assets/tile_grass.svg");
  this.load.image("bgSky", "./assets/bg_sky.svg");
  this.load.image("bgMountains", "./assets/bg_mountains.svg");
}

function create() {
  createStarTexture(this);
  createEnemyProjectileTexture(this);
  createAttackHitboxTexture(this);
  createPlayerAnimations(this);
  const levelConfig = getLevelConfig();

  const map = this.make.tilemap({
    data: levelConfig.data,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE
  });

  const tileset = map.addTilesetImage("tileGrass");
  worldLayer = map.createLayer(0, tileset, 0, 0);
  worldLayer.setCollision([0]);
  worldLayer.setDepth(3);

  const worldWidth = map.widthInPixels;
  const worldHeight = map.heightInPixels;

  bgSky = this.add.image(0, 0, "bgSky").setOrigin(0).setScrollFactor(0.15, 0.05);
  bgSky.setDisplaySize(worldWidth, worldHeight);
  bgSky.setDepth(0);

  bgMountains = this.add.image(0, 0, "bgMountains").setOrigin(0).setScrollFactor(0.35, 0.1);
  bgMountains.setDisplaySize(worldWidth, worldHeight);
  bgMountains.setDepth(1);

  this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

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
  this.cameras.main.startFollow(player, true, 0.09, 0.09);
  this.cameras.main.setDeadzone(120, 60);

  cursors = this.input.keyboard.createCursorKeys();
  attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
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
}

function update() {
  const left = cursors.left.isDown || touchState.left;
  const right = cursors.right.isDown || touchState.right;
  const jumpHeld = cursors.up.isDown || cursors.space.isDown || touchState.jump;
  const jumpPressed =
    Phaser.Input.Keyboard.JustDown(cursors.up) ||
    Phaser.Input.Keyboard.JustDown(cursors.space) ||
    (touchState.jump && !touchJumpWasDown);
  const attackPressed = Phaser.Input.Keyboard.JustDown(attackKey) || (touchState.attack && !touchAttackWasDown);

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
      maxLives: Math.round(toNumberInRange(parsed.maxLives, defaults.maxLives, 1, 5000))
    };
  } catch {
    return defaults;
  }
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
  const fallbackData = buildLevelData();
  const fallbackWorldWidth = fallbackData[0].length * TILE_SIZE;
  const fallback = {
    data: fallbackData,
    playerSpawn: { ...DEFAULT_PLAYER_SPAWN },
    enemySpawns: clampDefaultSpawnArray(DEFAULT_GROUND_ENEMIES, fallbackWorldWidth, 60),
    flyingSpawns: clampDefaultPointArray(DEFAULT_FLYING_ENEMIES, fallbackWorldWidth),
    chargerSpawns: clampDefaultSpawnArray(DEFAULT_CHARGERS, fallbackWorldWidth, 60),
    turretSpawns: clampDefaultSpawnArray(DEFAULT_TURRETS, fallbackWorldWidth, 60),
    bomberSpawns: clampDefaultPointArray(DEFAULT_BOMBERS, fallbackWorldWidth)
  };

  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed : parsed.data;

    if (!Array.isArray(data) || data.length < 2) {
      return fallback;
    }

    const cols = Array.isArray(data[0]) ? data[0].length : 0;
    if (cols < 8) {
      return fallback;
    }

    const normalized = data.map((row) => {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new Error("invalid level shape");
      }
      return row.map((cell) => (cell === 0 ? 0 : -1));
    });

    const worldWidth = cols * TILE_SIZE;
    const playerSpawn = normalizePoint(parsed.playerSpawn, fallback.playerSpawn, worldWidth);
    const enemySpawns = normalizeSpawnArray(parsed.enemySpawns, clampDefaultSpawnArray(DEFAULT_GROUND_ENEMIES, worldWidth, 60), worldWidth, 60);
    const flyingSpawns = normalizePointArray(parsed.flyingSpawns, clampDefaultPointArray(DEFAULT_FLYING_ENEMIES, worldWidth), worldWidth);
    const chargerSpawns = normalizeSpawnArray(parsed.chargerSpawns, clampDefaultSpawnArray(DEFAULT_CHARGERS, worldWidth, 60), worldWidth, 60);
    const turretSpawns = normalizeSpawnArray(parsed.turretSpawns, clampDefaultSpawnArray(DEFAULT_TURRETS, worldWidth, 60), worldWidth, 60);
    const bomberSpawns = normalizePointArray(parsed.bomberSpawns, clampDefaultPointArray(DEFAULT_BOMBERS, worldWidth), worldWidth);

    return {
      data: normalized,
      playerSpawn,
      enemySpawns,
      flyingSpawns,
      chargerSpawns,
      turretSpawns,
      bomberSpawns
    };
  } catch {
    return fallback;
  }
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
