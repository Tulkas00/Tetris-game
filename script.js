const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const gridWidth = 10;
const gridHeight = 16;

canvas.width = gridWidth * 15;
canvas.height = gridHeight * 15;

context.scale(canvas.width / gridWidth, canvas.height / gridHeight);

function createMatrix(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(0));
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = getPieceColor(value);
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function getPieceColor(value) {
  const colors = [
    null, '#FF0D72', '#0DC2FF', '#0DFF72',
    '#F538FF', '#FF8E0D', '#FFE138', '#3877FF',
  ];
  return colors[value];
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

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  return m.some((row, y) =>
    row.some((value, x) =>
      value !== 0 &&
      (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
    )
  );
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
}

function rotate(matrix, dir) {
  matrix = matrix.map((_, i) => matrix.map(row => row[i]));
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
  return matrix;
}

function playerRotate(dir) {
  const pos = player.pos.x;
  player.matrix = rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += pos > 0 ? -1 : 1;
    if (Math.abs(player.pos.x - pos) > player.matrix[0].length) {
      player.matrix = rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(pieces[(Math.random() * pieces.length) | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
  }
}

function playerMove(offset) {
  player.pos.x += offset;
  if (collide(arena, player)) player.pos.x -= offset;
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    if (arena[y].every(value => value !== 0)) {
      arena.splice(y, 1);
      arena.unshift(Array(gridWidth).fill(0));
      player.score += rowCount * 10;
      rowCount *= 2;
    }
  }
}

function createPiece(type) {
  const pieces = {
    'T': [[0, 1, 0], [1, 1, 1]],
    'O': [[2, 2], [2, 2]],
    'L': [[0, 3, 0], [0, 3, 0], [0, 3, 3]],
    'J': [[4, 0, 0], [4, 0, 0], [4, 4, 0]],
    'I': [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]],
    'S': [[0, 6, 6], [6, 6, 0]],
    'Z': [[7, 7, 0], [0, 7, 7]],
  };
  return pieces[type];
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

const arena = createMatrix(gridWidth, gridHeight);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') playerMove(-1);
  else if (event.key === 'ArrowRight') playerMove(1);
  else if (event.key === 'ArrowDown') playerDrop();
  else if (event.key === 'ArrowUp') playerRotate(1);
});

playerReset();
updateScore();
update();
