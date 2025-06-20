const canvas = document.getElementById('pingpong');
const ctx = canvas.getContext('2d');
const playerScoreElem = document.getElementById('player-score');
const aiScoreElem = document.getElementById('ai-score');
const paddleSelect = document.getElementById('paddle-select');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Constants
const TABLE_MARGIN = 30;
const NET_WIDTH = 4;
const NET_DASH = 18;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTHS = {
    normal: 12,
    wide: 24,
    slim: 8
};
const PLAYER_COLOR = "#fbc531";
const AI_COLOR = "#00a8ff";
const BALL_COLOR = "#fff";
const NET_COLOR_LIGHT = "#fff";
const NET_COLOR_DARK = "#eee";
const TABLE_COLOR_LIGHT = "#3b8450";
const TABLE_COLOR_DARK = "#222a36";

let theme = 'light';

// Game state
let paddleType = 'normal';
let playerPaddle = {
    x: TABLE_MARGIN,
    y: canvas.height/2 - PADDLE_HEIGHT/2,
    w: PADDLE_WIDTHS.normal,
    h: PADDLE_HEIGHT
};
let aiPaddle = {
    x: canvas.width - TABLE_MARGIN - PADDLE_WIDTHS.normal,
    y: canvas.height/2 - PADDLE_HEIGHT/2,
    w: PADDLE_WIDTHS.normal,
    h: PADDLE_HEIGHT
};
let ball = {
    x: canvas.width/2,
    y: canvas.height/2,
    r: 12,
    speed: 7,
    vx: 7 * (Math.random() > 0.5 ? 1 : -1),
    vy: 6 * (Math.random() - 0.5)
};
let playerScore = 0;
let aiScore = 0;
let isPaused = false;

// Utility functions
function resetBall() {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 2);
    ball.vy = (Math.random() - 0.5) * 10;
}

function setPaddleType(type) {
    paddleType = type;
    playerPaddle.w = PADDLE_WIDTHS[type];
    aiPaddle.w = PADDLE_WIDTHS[type];
    // Adjust X so it's always at the correct margin
    playerPaddle.x = TABLE_MARGIN;
    aiPaddle.x = canvas.width - TABLE_MARGIN - aiPaddle.w;
}

// Drawing functions
function drawTable() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Table border
    ctx.save();
    ctx.strokeStyle = (theme === 'light') ? '#e0e0e0' : '#444d5c';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width-4, canvas.height-4);
    ctx.restore();

    // Net
    ctx.save();
    ctx.strokeStyle = (theme === 'light') ? NET_COLOR_LIGHT : NET_COLOR_DARK;
    ctx.lineWidth = NET_WIDTH;
    ctx.setLineDash([NET_DASH, NET_DASH]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, TABLE_MARGIN);
    ctx.lineTo(canvas.width/2, canvas.height-TABLE_MARGIN);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Table margin lines
    ctx.save();
    ctx.strokeStyle = (theme === 'light') ? '#8fbc8f' : '#465a75';
    ctx.lineWidth = 2;
    ctx.strokeRect(TABLE_MARGIN, TABLE_MARGIN, canvas.width-2*TABLE_MARGIN, canvas.height-2*TABLE_MARGIN);
    ctx.restore();
}

function drawPaddle(paddle, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.restore();
}

function drawBall() {
    ctx.save();
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// Game mechanics
function moveAIPaddle() {
    // Simple AI: move paddle toward the ball, with some delay
    let center = aiPaddle.y + aiPaddle.h/2;
    if (Math.abs(center - ball.y) < 10) return;
    if (center < ball.y) {
        aiPaddle.y += Math.min(ball.speed * 0.48, ball.y - center, 8);
    } else {
        aiPaddle.y -= Math.min(ball.speed * 0.48, center - ball.y, 8);
    }
    // Clamp
    aiPaddle.y = Math.max(TABLE_MARGIN, Math.min(canvas.height - TABLE_MARGIN - aiPaddle.h, aiPaddle.y));
}

function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/Bottom wall collision
    if (ball.y - ball.r < TABLE_MARGIN) {
        ball.y = TABLE_MARGIN + ball.r;
        ball.vy *= -1;
    }
    if (ball.y + ball.r > canvas.height - TABLE_MARGIN) {
        ball.y = canvas.height - TABLE_MARGIN - ball.r;
        ball.vy *= -1;
    }

    // Paddle collision
    // Player
    if (
        ball.x - ball.r < playerPaddle.x + playerPaddle.w &&
        ball.x - ball.r > playerPaddle.x &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.h
    ) {
        ball.x = playerPaddle.x + playerPaddle.w + ball.r;
        ball.vx *= -1.05;
        // Add some "spin" based on where hit
        let relImpact = (ball.y - (playerPaddle.y + playerPaddle.h/2)) / (playerPaddle.h/2);
        ball.vy += relImpact * 4;
    }
    // AI
    if (
        ball.x + ball.r > aiPaddle.x &&
        ball.x + ball.r < aiPaddle.x + aiPaddle.w &&
        ball.y > aiPaddle.y &&
        ball.y < aiPaddle.y + aiPaddle.h
    ) {
        ball.x = aiPaddle.x - ball.r;
        ball.vx *= -1.05;
        let relImpact = (ball.y - (aiPaddle.y + aiPaddle.h/2)) / (aiPaddle.h/2);
        ball.vy += relImpact * 4;
    }

    // Left/Right wall (score)
    if (ball.x < 0) {
        aiScore++;
        updateScore();
        resetBall();
        isPaused = true;
        setTimeout(()=>{ isPaused = false; }, 900);
    }
    if (ball.x > canvas.width) {
        playerScore++;
        updateScore();
        resetBall();
        isPaused = true;
        setTimeout(()=>{ isPaused = false; }, 900);
    }
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top;
    // Center paddle to mouse
    playerPaddle.y = mouseY - playerPaddle.h/2;
    // Clamp
    playerPaddle.y = Math.max(TABLE_MARGIN, Math.min(canvas.height - TABLE_MARGIN - playerPaddle.h, playerPaddle.y));
});

paddleSelect.addEventListener('change', (e) => {
    setPaddleType(e.target.value);
});

themeToggle.addEventListener('click', () => {
    theme = (theme === 'light') ? 'dark' : 'light';
    body.className = theme;
    themeToggle.textContent = (theme === 'light') ? 'Switch to Dark' : 'Switch to Light';
    // Optionally: re-render for color changes
});

// Score update
function updateScore() {
    playerScoreElem.textContent = playerScore;
    aiScoreElem.textContent = aiScore;
}

// Game loop
function gameLoop() {
    drawTable();
    drawPaddle(playerPaddle, PLAYER_COLOR);
    drawPaddle(aiPaddle, AI_COLOR);
    drawBall();

    if (!isPaused) {
        moveAIPaddle();
        updateBall();
    }
    requestAnimationFrame(gameLoop);
}

// Initialization
function init() {
    setPaddleType('normal');
    updateScore();
    gameLoop();
}

init();
