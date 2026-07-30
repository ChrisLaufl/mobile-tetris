const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Scale canvas grid (12 columns, 20 rows)
context.scale(20, 20);

const COLORS = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // I
  '#0DFF72', // S
  '#F538FF', // Z
  '#FF8E0D', // L
  '#FFE138', // O
  '#3877FF'  // J
];

const SHAPES = 'TJLOSZI';

function createPiece(type) {
  if (type === 'I') {
    return [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ];
  } else if (type === 'L') {
    return [
      [0, 5, 0],
      [0, 5, 0],
      [0, 5, 5],
    ];
  } else if (type === 'J') {
    return [
      [0, 7, 0],
      [0, 7, 0],
      [7, 7, 0],
    ];
  } else if (type === 'O') {
    return [
      [6, 6],
      [6, 6],
    ];
  } else if (type === 'Z') {
    return [
      [4, 4, 0],
      [0, 4, 4],
      [0, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 3, 3],
      [3, 3, 0],
      [0, 0, 0],
    ];
  } else if (type === 'T') {
    return [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
  }
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

const arena = createMatrix(12, 20);

const player = {
  pos: {x: 0, y: 0},
  matrix: null,
  score: 0,
};

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
         (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
  }
  updateScore();
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerHardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  playerReset();
  arenaSweep();
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerReset() {
  const pieces = SHAPES;
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
  }
}

function updateScore() {
  scoreElement.innerText = player.score;
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = COLORS[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  // Clear the canvas so the CSS grid pattern shows through empty spots
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

// Keyboard Controls (For Desktop testing)
document.addEventListener('keydown', event => {
  if (event.keyCode === 37) playerMove(-1);        // Left Arrow
  else if (event.keyCode === 39) playerMove(1);   // Right Arrow
  else if (event.keyCode === 40) playerDrop();     // Down Arrow
  else if (event.keyCode === 38) playerRotate(1);  // Up Arrow (Rotate)
  else if (event.keyCode === 32) playerHardDrop(); // Spacebar (Hard Drop)
});

// Touch Controls (For Mobile screens)
function bindButton(id, callback) {
  const btn = document.getElementById(id);
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    callback();
  });
  btn.addEventListener('click', (e) => {
    callback();
  });
}

bindButton('btn-left', () => playerMove(-1));
bindButton('btn-right', () => playerMove(1));
bindButton('btn-down', () => playerDrop());
bindButton('btn-rotate', () => playerRotate(1));
bindButton('btn-drop', () => playerHardDrop());

// Start the game
playerReset();
updateScore();
update();
