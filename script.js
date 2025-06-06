const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const scrollText = document.getElementById('scrollText');

const eatSound      = document.getElementById('eatSound');
const gameOverSound = document.getElementById('gameOverSound');
const bgm           = document.getElementById('bgm');

const bgmSlider     = document.getElementById('bgmVolume');
const sfxSlider     = document.getElementById('sfxVolume');

const grid = 16;
let score = 0;
let highScore = parseInt(getCookie("highScore")) || 0;
let gameStarted = false;
let gameOverFlag = false;

// 초기 볼륨 설정
bgm.volume = parseFloat(bgmSlider.value);
eatSound.volume = parseFloat(sfxSlider.value);
gameOverSound.volume = parseFloat(sfxSlider.value);

const snake = {
  x: 160,
  y: 160,
  dx: 0,
  dy: 0,
  cells: [],
  maxCells: 4
};

const apple = {
  x: 320,
  y: 320
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, value] = c.split("=");
    if (key === name) return value;
  }
  return null;
}

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 86400000));
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
}

function updateScoreBoard() {
  scoreBoard.innerText = `점수: ${score} | 최고 점수: ${highScore}`;
  scrollText.innerText = `-==${"=".repeat(score)}=<*><~`;
}

function showGameOverModal() {
  gameOverSound.currentTime = 0;
  gameOverSound.play();
  modal.style.display = "flex";
  gameOverFlag = true;

  // VFX: 흔들림 효과 + 깜빡임 효과
  canvas.classList.add('shake-strong');
  document.body.classList.add('flash');
  setTimeout(() => {
    canvas.classList.remove('shake-strong');
    document.body.classList.remove('flash');
  }, 400);

  bgm.pause();
}

function restartGame() {
  modal.style.display = "none";
  snake.x = 160;
  snake.y = 160;
  snake.dx = 0;
  snake.dy = 0;
  snake.cells = [];
  snake.maxCells = 4;
  apple.x = getRandomInt(0, 25) * grid;
  apple.y = getRandomInt(0, 25) * grid;
  score = 0;
  gameOverFlag = false;
  gameStarted = false;
  updateScoreBoard();

  // 스크롤 텍스트 애니메이션 리셋
  scrollText.style.animation = 'none';
  void scrollText.offsetWidth;
  scrollText.style.animation = '';
}

function drawGrid() {
  context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  for (let x = 0; x <= canvas.width; x += grid) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += grid) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
}

let lastTime = 0;
const speed = 66;

function loop(timestamp) {
  requestAnimationFrame(loop);

  if (!gameStarted || gameOverFlag) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if (!gameStarted) {
      context.fillStyle = 'white';
      context.font = '20px monospace';
      context.fillText('Press arrow key or WASD to start', 50, 200);
    }
    return;
  }

  if (timestamp - lastTime < speed) return;
  lastTime = timestamp;

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  snake.x += snake.dx;
  snake.y += snake.dy;

  if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
    if (score > highScore) {
      highScore = score;
      setCookie("highScore", highScore, 365);
    }
    showGameOverModal();
    return;
  }

  snake.cells.unshift({ x: snake.x, y: snake.y });
  if (snake.cells.length > snake.maxCells) snake.cells.pop();

  // 사과 그리기
  context.fillStyle = 'red';
  context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

  // 뱀 그리기 및 충돌 체크
  context.fillStyle = 'green';
  snake.cells.forEach((cell, index) => {
    context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

    // 사과 먹기
    if (cell.x === apple.x && cell.y === apple.y) {
      eatSound.currentTime = 0;
      eatSound.play();
      score++;
      snake.maxCells = 4 + score;
      updateScoreBoard();
      apple.x = getRandomInt(0, 25) * grid;
      apple.y = getRandomInt(0, 25) * grid;
    }

    // 자기 몸과 충돌
    for (let i = index + 1; i < snake.cells.length; i++) {
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        if (score > highScore) {
          highScore = score;
          setCookie("highScore", highScore, 365);
        }
        showGameOverModal();
        return;
      }
    }
  });
}

document.addEventListener('keydown', function (e) {
  const key = e.key.toLowerCase();
  const arrowKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  const wasdKeys = ['w', 'a', 's', 'd'];

  if (gameOverFlag) {
    restartGame();
    return;
  }

  if (!gameStarted && (arrowKeys.includes(key) || wasdKeys.includes(key))) {
    gameStarted = true;
    updateScoreBoard();
    bgm.currentTime = 0;
    bgm.play();
  }

  // 방향 전환
  if ((key === 'arrowleft' || key === 'a') && snake.dx === 0) {
    snake.dx = -grid; snake.dy = 0;
  } else if ((key === 'arrowup' || key === 'w') && snake.dy === 0) {
    snake.dy = -grid; snake.dx = 0;
  } else if ((key === 'arrowright' || key === 'd') && snake.dx === 0) {
    snake.dx = grid; snake.dy = 0;
  } else if ((key === 'arrowdown' || key === 's') && snake.dy === 0) {
    snake.dy = grid; snake.dx = 0;
  }
});

// 볼륨 슬라이더 이벤트 리스너
bgmSlider.addEventListener('input', () => {
  bgm.volume = parseFloat(bgmSlider.value);
});
sfxSlider.addEventListener('input', () => {
  eatSound.volume = parseFloat(sfxSlider.value);
  gameOverSound.volume = parseFloat(sfxSlider.value);
});

updateScoreBoard();
requestAnimationFrame(loop);
