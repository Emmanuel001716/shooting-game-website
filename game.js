const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = {};

let gameState = {
  running: false,
  score: 0,
  health: 100,
  lastTime: 0,
  spawnTimer: 0,
  enemySpeed: 110,
};

const player = {
  x: WIDTH / 2,
  y: HEIGHT - 56,
  width: 38,
  height: 44,
  speed: 420,
  shootCooldown: 0,
};

const bullets = [];
const enemies = [];
const particles = [];
const stars = Array.from({ length: 90 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * HEIGHT,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 40 + 20,
}));

function resetGame() {
  gameState.score = 0;
  gameState.health = 100;
  gameState.spawnTimer = 0.8;
  gameState.enemySpeed = 110;
  player.x = WIDTH / 2;
  player.y = HEIGHT - 56;
  player.shootCooldown = 0;
  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  scoreElement.textContent = '0';
  healthElement.textContent = '100';
}

function startGame() {
  resetGame();
  gameState.running = true;
  overlay.classList.remove('visible');
}

function endGame() {
  gameState.running = false;
  overlay.classList.add('visible');
  overlay.querySelector('.panel h1').textContent = 'Game Over';
  overlay.querySelector('.panel p').textContent = `Final score: ${gameState.score}. Press the button to play again.`;
  startButton.textContent = 'Play Again';
}

function showStartScreen() {
  gameState.running = false;
  overlay.classList.add('visible');
  overlay.querySelector('.panel h1').textContent = 'Star Defender';
  overlay.querySelector('.panel p').textContent = 'Defend your ship from incoming enemy waves.';
  startButton.textContent = 'Start Game';
}

function shoot() {
  if (!gameState.running || player.shootCooldown > 0) {
    return;
  }

  player.shootCooldown = 0.22;
  bullets.push({
    x: player.x,
    y: player.y - 18,
    radius: 5,
    speed: 520,
  });
}

function spawnEnemy() {
  const size = 24 + Math.random() * 16;
  const x = 18 + Math.random() * (WIDTH - 36 - size);

  enemies.push({
    x,
    y: -size,
    width: size,
    height: size,
    speed: gameState.enemySpeed + Math.random() * 40,
    drift: (Math.random() - 0.5) * 80,
  });
}

function createBurst(x, y, color) {
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 160,
      vy: (Math.random() - 0.5) * 160,
      radius: Math.random() * 3 + 2,
      life: 0.6 + Math.random() * 0.6,
      color,
    });
  }
}

function update(delta) {
  player.shootCooldown = Math.max(0, player.shootCooldown - delta);

  if (keys.ArrowLeft || keys.a) {
    player.x -= player.speed * delta;
  }
  if (keys.ArrowRight || keys.d) {
    player.x += player.speed * delta;
  }

  if (keys.Space || keys[' '] || keys.w) {
    shoot();
  }

  player.x = Math.max(28, Math.min(WIDTH - 28, player.x));

  gameState.spawnTimer -= delta;
  if (gameState.spawnTimer <= 0) {
    spawnEnemy();
    gameState.spawnTimer = Math.max(0.45, 1.1 - gameState.score * 0.008);
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.y -= bullet.speed * delta;

    if (bullet.y < -20) {
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const enemy = enemies[j];
      const hitX = bullet.x > enemy.x && bullet.x < enemy.x + enemy.width;
      const hitY = bullet.y > enemy.y && bullet.y < enemy.y + enemy.height;

      if (hitX && hitY) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        gameState.score += 10;
        gameState.enemySpeed += 2;
        scoreElement.textContent = String(gameState.score);
        createBurst(bullet.x, bullet.y, '#78f7ff');
        break;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    enemy.x += enemy.drift * delta;
    enemy.y += enemy.speed * delta;

    if (enemy.x < 0 || enemy.x + enemy.width > WIDTH) {
      enemy.drift *= -1;
    }

    if (enemy.y + enemy.height >= HEIGHT - 30) {
      enemies.splice(i, 1);
      gameState.health -= 15;
      healthElement.textContent = String(Math.max(0, gameState.health));
      createBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff5ebc');

      if (gameState.health <= 0) {
        endGame();
        return;
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }

  for (const star of stars) {
    star.y += star.speed * delta;
    if (star.y > HEIGHT) {
      star.y = -10;
      star.x = Math.random() * WIDTH;
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#070d1d');
  gradient.addColorStop(1, '#101f46');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const star of stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  ctx.strokeStyle = 'rgba(120, 247, 255, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i += 1) {
    const y = (HEIGHT / 8) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const { x, y, width, height } = player;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#78f7ff';
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(width / 2, height / 2);
  ctx.lineTo(0, height / 3);
  ctx.lineTo(-width / 2, height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff5ebc';
  ctx.fillRect(-5, 10, 10, 16);
  ctx.restore();
}

function drawBullets() {
  for (const bullet of bullets) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = '#ff5ebc';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(enemy.x + 6, enemy.y + 8, enemy.width - 12, 5);
    ctx.fillRect(enemy.x + 6, enemy.y + enemy.height - 12, enemy.width - 12, 5);
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function render() {
  drawBackground();
  drawParticles();
  drawBullets();
  drawEnemies();
  drawPlayer();
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - gameState.lastTime) / 1000 || 0, 0.025);
  gameState.lastTime = timestamp;

  if (gameState.running) {
    update(delta);
  }

  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = true;

  if (event.code === 'Space') {
    event.preventDefault();
    keys.Space = true;
    if (gameState.running) {
      shoot();
    }
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;

  if (event.code === 'Space') {
    keys.Space = false;
  }
});

canvas.addEventListener('pointerdown', () => {
  if (gameState.running) {
    shoot();
  }
});

startButton.addEventListener('click', () => {
  startGame();
});

showStartScreen();
requestAnimationFrame(gameLoop);
