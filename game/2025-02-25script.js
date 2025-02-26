const holes = document.querySelectorAll('.hole');
const moles = document.querySelectorAll('.mole');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const comboDisplay = document.getElementById('combo');
const progressBar = document.getElementById('progress');
const powerUpDisplay = document.getElementById('powerUp');
const challengeDisplay = document.getElementById('challenge');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const leaderboardList = document.getElementById('leaderboardList');
const difficultySelect = document.getElementById('difficultySelect');
const floatingText = document.getElementById('floating-text');
const gameBoard = document.querySelector('.game-board');

let score = 0;
let timeLeft = 60;
let gameActive = false;
let moleInterval;
let countdownInterval;
let moleTimeouts = [];
let floatingTimeouts = [];
let hitTimeouts = [];
let powerUpTimeouts = [];
let clickCooldowns = new Map();
let comboCount = 0;
let lastHitTime = 0;
let maxCombo = 0;
let stage = 0;
let goldenMoleCount = 0;
let hitCount = 0;
let powerUp = null;
let powerUpActive = false;
let challengeGoal = { type: '', value: 0, text: '' };
let challengeProgress = 0;
let playerName = '';

let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

function getMoleTiming() {
    const difficulty = difficultySelect.value;
    let baseTime;
    switch (difficulty) {
        case 'easy': baseTime = 1500; break;
        case 'normal': baseTime = 1000; break;
        case 'hard': baseTime = Math.floor(Math.random() * (1000 - 600 + 1)) + 600; break;
        default: baseTime = 1000;
    }
    const speedUp = comboCount >= 15 ? 0.7 : comboCount >= 10 ? 0.8 : comboCount >= 5 ? 0.9 : 1;
    return Math.max(baseTime * speedUp - Math.floor((60 - timeLeft) / 10) * 50, 400);
}

function isAnyMoleActive() {
    return Array.from(moles).some(mole => mole.classList.contains('active'));
}

function showFloatingText(mole, text) {
    const rect = mole.getBoundingClientRect();
    const boardRect = gameBoard.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'floating-score';
    span.textContent = text;
    span.style.left = `${rect.left - boardRect.left + rect.width / 2 - 10}px`;
    span.style.top = `${rect.top - boardRect.top - 10}px`;
    floatingText.appendChild(span);
    const timeout = setTimeout(() => span.remove(), 700);
    floatingTimeouts.push(timeout);
}

function activatePowerUp(type) {
    if (powerUpActive) return;
    powerUpActive = true;
    powerUp = type;
    powerUpDisplay.textContent = type;
    const timeout = setTimeout(() => {
        powerUpActive = false;
        powerUp = null;
        powerUpDisplay.textContent = '無';
    }, 5000);
    powerUpTimeouts.push(timeout);
}

function generateChallenge() {
    const goals = [
        { text: '擊中20隻地鼠', value: 20, type: 'hit' },
        { text: '達到50分', value: 50, type: 'score' },
        { text: '10次連擊', value: 10, type: 'combo' }
    ];
    challengeGoal = goals[Math.floor(Math.random() * goals.length)];
    challengeProgress = 0;
    challengeDisplay.textContent = challengeGoal.text;
}

function randomMole(isGolden = false) {
    if (isAnyMoleActive() && !isGolden) {
        moleInterval = setTimeout(() => randomMole(), 100);
        moleTimeouts.push(moleInterval);
        return;
    }

    const randomIndex = Math.floor(Math.random() * moles.length);
    const mole = moles[randomIndex];
    const timing = getMoleTiming();
    mole.classList.add('active');
    if (isGolden || (!goldenMoleCount && Math.random() < 0.1)) {
        mole.classList.add('golden');
    }
    if (comboCount >= 5) mole.classList.add('combo-5');
    if (comboCount >= 10) mole.classList.add('combo-10');
    if (comboCount >= 15) mole.classList.add('combo-15');

    const timeout = setTimeout(() => {
        if (mole.classList.contains('active')) {
            mole.classList.remove('active', 'golden', 'hit', 'combo-5', 'combo-10', 'combo-15');
            if (gameActive) {
                moleInterval = setTimeout(randomMole, timing);
                moleTimeouts.push(moleInterval);
            }
        }
    }, timing);
    moleTimeouts.push(timeout);
}

function startGame() {
    if (gameActive) return;
    playerName = prompt('請輸入你的名稱：', '玩家') || '無名';
    gameActive = true;
    score = 0;
    timeLeft = 60;
    comboCount = 0;
    maxCombo = 0;
    stage = 0;
    goldenMoleCount = 0;
    hitCount = 0;
    powerUp = null;
    powerUpActive = false;
    moleTimeouts = [];
    floatingTimeouts = [];
    hitTimeouts = [];
    powerUpTimeouts = [];
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    comboDisplay.textContent = comboCount;
    powerUpDisplay.textContent = '無';
    generateChallenge();
    progressBar.style.width = '100%';
    startBtn.textContent = '遊戲進行中';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    difficultySelect.disabled = true;
    document.body.classList.add('playing');

    randomMole();

    countdownInterval = setInterval(() => {
        if (!powerUpActive || powerUp !== '時間凍結') { // 嚴格檢查
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            const progressPercent = (timeLeft % 20) / 20 * 100;
            progressBar.style.width = `${progressPercent}%`;
            if (timeLeft % 20 === 0 && timeLeft > 0) {
                stage++;
                score += 10;
                scoreDisplay.textContent = score;
                alert(`階段 ${stage} 完成！獎勵 +10 分`);
            }
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                moleTimeouts.forEach(clearTimeout);
                moleTimeouts = [];
                endGame();
            }
        }
    }, 1000);
}

function stopGame() {
    if (!gameActive) return;
    gameActive = false;
    clearTimeout(moleInterval);
    clearInterval(countdownInterval);
    moleTimeouts.forEach(clearTimeout);
    floatingTimeouts.forEach(clearTimeout);
    hitTimeouts.forEach(clearTimeout);
    powerUpTimeouts.forEach(clearTimeout);
    moleTimeouts = [];
    floatingTimeouts = [];
    hitTimeouts = [];
    powerUpTimeouts = [];
    moles.forEach(mole => mole.classList.remove('active', 'golden', 'hit', 'combo-5', 'combo-10', 'combo-15'));
    floatingText.innerHTML = '';
    document.body.classList.remove('playing', 'combo-5', 'combo-10', 'combo-15');
    goldenMoleCount = 0;
    powerUp = null;
    powerUpActive = false;
    powerUpDisplay.textContent = '無';
    endGame();
}

function updateLeaderboard() {
    leaderboard.push({ name: playerName, score, maxCombo });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `第 ${index + 1} 名: ${entry.name} - ${entry.score} 分 (最佳連擊: ${entry.maxCombo})`;
        leaderboardList.appendChild(li);
    });
}

function endGame() {
    gameActive = false;
    updateLeaderboard();
    displayLeaderboard(); // 同步更新顯示
    startBtn.textContent = '開始遊戲';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    difficultySelect.disabled = false;
    alert(`遊戲結束！得分: ${score}\n最高連擊: ${maxCombo}`);
}

function handleHit(mole, e) {
    if (!gameActive) return;

    const now = Date.now();
    const lastClick = clickCooldowns.get(mole) || 0;
    if (now - lastClick < 150) return; // 調整防抖至150毫秒
    clickCooldowns.set(mole, now);

    if (mole.classList.contains('active')) {
        const hitTime = now;
        const timeSinceLastHit = hitTime - lastHitTime;
        lastHitTime = hitTime;
        let points = 1;

        hitCount++;
        challengeProgress = challengeGoal.type === 'hit' ? hitCount : challengeGoal.type === 'score' ? score : comboCount; // 即時更新
        if (challengeProgress >= challengeGoal.value && challengeGoal.value > 0) {
            score += 20;
            timeLeft += 5;
            alert('挑戰達成！獎勵 +20 分 +5 秒');
            challengeGoal.value = 0;
        }

        if (hitCount % 10 === 0 && !powerUpActive) {
            powerUp = Math.random() < 0.5 ? '時間凍結' : '雙倍分數';
            activatePowerUp(powerUp);
        }

        if (mole.classList.contains('golden')) {
            points = 5;
            mole.classList.remove('golden');
            if (goldenMoleCount === 0 && !isAnyMoleActive()) { // 同步檢查
                goldenMoleCount = 3;
                for (let i = 0; i < 3 && goldenMoleCount > 0; i++) {
                    const timeout = setTimeout(() => {
                        if (goldenMoleCount > 0 && gameActive) {
                            goldenMoleCount--;
                            randomMole(true);
                        }
                    }, i * 200);
                    moleTimeouts.push(timeout);
                }
            }
            showFloatingText(mole, '+5');
        } else {
            showFloatingText(mole, '+1');
        }

        if (timeSinceLastHit < 700) {
            comboCount++;
            points += 1;
            if (comboCount % 5 === 0) {
                alert(`Combo Bonus! ${comboCount} 連擊！`);
            }
        } else {
            comboCount = 1;
        }
        maxCombo = Math.max(maxCombo, comboCount);

        document.body.classList.remove('combo-5', 'combo-10', 'combo-15');
        if (comboCount >= 5) document.body.classList.add('combo-5');
        if (comboCount >= 10) document.body.classList.add('combo-10');
        if (comboCount >= 15) document.body.classList.add('combo-15');

        score += powerUpActive && powerUp === '雙倍分數' ? points * 2 : points;
        mole.classList.add('hit');
        const hitTimeout = setTimeout(() => {
            mole.classList.remove('hit');
        }, 100);
        hitTimeouts.push(hitTimeout);
        mole.classList.remove('active');
        clearTimeout(moleInterval);
        if (gameActive) {
            const nextDelay = Math.floor(Math.random() * 150) + 50;
            moleInterval = setTimeout(randomMole, nextDelay);
            moleTimeouts.push(moleInterval);
        }
    } else {
        score -= 1;
        comboCount = 0;
        document.body.classList.remove('combo-5', 'combo-10', 'combo-15');
    }
    scoreDisplay.textContent = score;
    comboDisplay.textContent = comboCount;
}

moles.forEach((mole) => {
    mole.addEventListener('click', (e) => handleHit(mole, e));
    mole.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleHit(mole, e);
    });
});

startBtn.addEventListener('click', startGame);
stopBtn.addEventListener('click', stopGame);

displayLeaderboard();
