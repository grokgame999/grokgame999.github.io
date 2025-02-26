// 遊戲變數
let stardust = 0;
let drones = 0;
let droneCost = 10;
let droneEff = 1;
let droneEffCost = 50;
let clickEff = 0.5;
let clickEffCost = 25;
let stage = 1;
let stageProgress = 0;
let stageGoals = Array.from({ length: 50 }, (_, i) => Math.round(1000 * (i + 1) * Math.pow(1.15, i)));
let clickCombo = 0;
let lastClickTime = 0;
let taskActive = false;
let taskTimer = 0;
let taskGoal = 0;
let stardustText, dronesText, droneCostText, droneEffText, droneEffCostText, clickEffText, clickEffCostText, stageText, stageProgressText, stageGoalText, clickComboText, taskTimerText, dronesContainer, eventLog, planet, droneButton;
let clickSound, upgradeSound, meteorSound, enemySound;
let minuteStardustGain = 0;
let eventIntervalId;

const stageAbilities = Array.from({ length: 50 }, (_, i) => {
    if (i === 0) return null;
    if (i % 4 === 1) return () => clickEff *= 1.1;
    if (i % 4 === 2) return () => droneEff *= 1.1;
    if (i % 4 === 3) return () => stardust += 500 * i;
    return () => drones < 10 && (drones += 1, createDrone(drones - 1));
});
const droneColors = ['#c0c0c0', '#ff9999', '#99ff99', '#9999ff', '#ffff99', '#ff99ff'];
const flameColors = ['#ff4500', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

// 追蹤任務相關變數
let taskCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    stardustText = document.getElementById('stardust');
    dronesText = document.getElementById('drones');
    droneCostText = document.getElementById('droneCost');
    droneEffText = document.getElementById('droneEff');
    droneEffCostText = document.getElementById('droneEffCost');
    clickEffText = document.getElementById('clickEff');
    clickEffCostText = document.getElementById('clickEffCost');
    stageText = document.getElementById('stage');
    stageProgressText = document.getElementById('stageProgress');
    stageGoalText = document.getElementById('stageGoal');
    clickComboText = document.getElementById('clickCombo');
    taskTimerText = document.getElementById('taskTimer');
    dronesContainer = document.getElementById('drones-container');
    eventLog = document.getElementById('event-log');
    planet = document.querySelector('.planet');
    droneButton = document.getElementById('droneButton');
    clickSound = document.getElementById('clickSound');
    upgradeSound = document.getElementById('upgradeSound');
    meteorSound = document.getElementById('meteorSound');
    enemySound = document.getElementById('enemySound');

    loadProgress();
    updatePlanetAppearance();
    planet.style.animation = 'rotatePlanet 20s infinite linear';
    requestAnimationFrame(updateGameLoop);
    setInterval(autoCollect, 1000);
    setInterval(logMinuteGain, 60000);
    setInterval(updateTaskTimer, 1000);
    updateEventInterval();
    updateDroneButtonState();
    startRandomTask();
});

function updateGameLoop() {
    updateUI();
    requestAnimationFrame(updateGameLoop);
}

function collectStardust(event) {
    const now = Date.now();
    const comboMultiplier = (now - lastClickTime < 1000) ? Math.min(clickCombo + 1, 5) : 1;
    clickCombo = comboMultiplier > 1 ? clickCombo + 1 : 0;
    lastClickTime = now;

    const gain = clickEff * stage * comboMultiplier;
    stardust += gain;
    stageProgress += gain;
    checkStageProgress();
    updateUI(true);
    logEvent(`點擊星球 ${stage}，獲得 ${Math.round(gain)} 星塵${comboMultiplier > 1 ? ` (連擊 x${comboMultiplier})` : ''}`, 'gain');
    updateDroneButtonState();

    if (taskActive && taskGoal > 0) {
        taskGoal -= gain;
        if (taskGoal <= 0) completeTask();
        taskGoal = Math.max(0, taskGoal);
    }

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    const planet = event.target;
    const rect = planet.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const dx = (Math.random() - 0.5) * 60;
        const dy = (Math.random() - 0.5) * 60;
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        document.getElementById('game-container').appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }

    saveProgress();
}

function autoCollect() {
    const gain = drones * 0.2 * droneEff * stage;
    stardust += gain;
    minuteStardustGain += gain;
    stageProgress += gain;
    checkStageProgress();
    updateUI(false);
    updateDroneButtonState();
    saveProgress();
}

function logMinuteGain() {
    if (minuteStardustGain > 0) {
        logEvent(`過去一分鐘，無人機採集 ${Math.round(minuteStardustGain)} 星塵`, 'gain');
        minuteStardustGain = 0;
    }
}

function createDrone(index) {
    const drone = document.createElement('div');
    drone.className = 'spaceship';
    const radius = 120 + (index + 1) * 25;
    const duration = 4 + (index + 1) * 0.5;
    const bodyColor = droneColors[Math.floor(Math.random() * droneColors.length)];
    const flameColor = flameColors[Math.floor(Math.random() * flameColors.length)];
    drone.style.setProperty('--radius', `${radius}px`);
    drone.style.setProperty('--duration', `${duration}s`);
    drone.style.setProperty('--body-color', bodyColor);
    drone.style.setProperty('--flame-color', flameColor);
    drone.style.left = '50%';
    drone.style.top = '50%';
    drone.innerHTML = `
        <style>
            .spaceship { background: linear-gradient(135deg, ${bodyColor}, ${bodyColor}80); }
            .spaceship::after { background: radial-gradient(${flameColor}, ${flameColor}80); }
        </style>
        <div class="flame-tail"></div>
    `;
    drone.onclick = () => handleDroneClick(index);
    dronesContainer.appendChild(drone);
}

function handleDroneClick(index) {
    const events = [
        () => { stardust += 50 * stage; logEvent(`飛船 ${index + 1} 發現資源，獲得 ${50 * stage} 星塵`, 'gain'); },
        () => { if (drones > 1) { drones--; dronesContainer.removeChild(dronesContainer.children[index]); logEvent(`飛船 ${index + 1} 失控，損失 1 架無人機`, 'loss'); } },
        () => { droneEff += 0.1; logEvent(`飛船 ${index + 1} 優化引擎，效率提升 0.1`, 'info'); }
    ];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
    updateUI(true);
    updateDroneButtonState();
    saveProgress();
}

function upgradeDrone() {
    if (stardust >= droneCost && drones < 10) {
        stardust -= droneCost;
        drones += 1;
        droneCost = Math.floor(10 * Math.pow(2, drones));

        upgradeSound.currentTime = 0;
        upgradeSound.play().catch(() => {});

        createDrone(drones - 1);

        logEvent(`升級無人機，數量增至 ${drones}`, 'info');
        updateUI(true);
        updateEventInterval();
        updateDroneButtonState();
        saveProgress();
    }
}

function upgradeDroneEff() {
    if (stardust >= droneEffCost) {
        stardust -= droneEffCost;
        droneEff += 0.1;
        droneEffCost = Math.floor(droneEffCost * 2);

        upgradeSound.currentTime = 0;
        upgradeSound.play().catch(() => {});

        logEvent(`無人機效率提升至 ${droneEff.toFixed(1)}`, 'info');
        updateUI(true);
        updateDroneButtonState();
        saveProgress();
    } else {
        alert('星塵不足！');
    }
}

function upgradeClickEff() {
    if (stardust >= clickEffCost) {
        stardust -= clickEffCost;
        clickEff += 0.5;
        clickEffCost = Math.floor(clickEffCost * 1.3);

        upgradeSound.currentTime = 0;
        upgradeSound.play().catch(() => {});

        logEvent(`點擊收益提升至 ${clickEff.toFixed(1)}`, 'info');
        updateUI(true);
        updateDroneButtonState();
        saveProgress();
    } else {
        alert('星塵不足！');
    }
}

function checkStageProgress() {
    if (stage - 1 < stageGoals.length && stageProgress >= stageGoals[stage - 1]) {
        stage += 1;
        stageProgress = 0;
        updatePlanetAppearance();
        planet.style.animation = 'rotatePlanet 20s infinite linear, spawn 0.5s ease-out';
        setTimeout(() => planet.style.animation = 'rotatePlanet 20s infinite linear', 500);
        logEvent(`達成階段目標，解鎖星球 ${stage}！獲得特殊能力`, 'info');
        if (stageAbilities[stage - 1]) {
            stageAbilities[stage - 1]();
            logEvent(`激活星球 ${stage} 能力`, 'info');
        }
        updateUI(true);
        updateDroneButtonState();
    }
}

function updatePlanetAppearance() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const r2 = Math.floor(Math.random() * 256);
    const g2 = Math.floor(Math.random() * 256);
    const b2 = Math.floor(Math.random() * 256);
    planet.style.background = `radial-gradient(circle at 30% 30%, rgb(${r}, ${g}, ${b}), rgb(${r2}, ${g2}, ${b2}), #2f2f2f)`;
    planet.className = `planet stage-${stage}`;
    planet.innerHTML = '<div class="texture"></div>';
}

function updateEventInterval() {
    clearInterval(eventIntervalId);
    const baseInterval = 15000;
    const interval = Math.max(5000, baseInterval - drones * 1000 / stage);
    eventIntervalId = setInterval(randomEvent, interval);
}

function randomEvent() {
    const eventType = Math.random();
    const stageMultiplier = stage * 0.5;
    if (eventType < 0.20) {
        meteorShower(stageMultiplier);
    } else if (eventType < 0.35) {
        enemyAttack(stageMultiplier);
    } else if (eventType < 0.50) {
        resourceBoost(stageMultiplier);
    } else if (eventType < 0.65) {
        droneMalfunction();
    } else if (eventType < 0.80) {
        cosmicStorm(stageMultiplier);
    } else if (eventType < 0.90) {
        droneBoost();
    } else {
        stardustDoubler();
    }
}

function meteorShower(multiplier) {
    meteorSound.currentTime = 0;
    meteorSound.play().catch(() => {});

    for (let i = 0; i < 5; i++) {
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        const startX = Math.random() * 1000;
        const startY = -10;
        const endX = startX - 250;
        const endY = 700;
        meteor.style.setProperty('--startX', `${startX}px`);
        meteor.style.setProperty('--startY', `${startY}px`);
        meteor.style.setProperty('--endX', `${endX}px`);
        meteor.style.setProperty('--endY', `${endY}px`);
        document.getElementById('game-container').appendChild(meteor);
        setTimeout(() => meteor.remove(), 1000);
    }

    const gain = Math.round(10 * multiplier);
    stardust += gain;
    stageProgress += gain;
    checkStageProgress();
    logEvent(`流星雨來襲，獲得 ${gain} 星塵`, 'gain');
    updateUI(true);
    updateDroneButtonState();
    saveProgress();
}

// 在 2025-02-26script.js 中替換
function enemyAttack(multiplier) {
    enemySound.currentTime = 0;
    enemySound.play().catch(() => {});

    const enemy = document.createElement('div');
    enemy.className = 'enemy';
    const startX = Math.random() * 1000;
    const startY = Math.random() * 100;
    enemy.style.setProperty('--startX', `${startX}px`);
    enemy.style.setProperty('--startY', `${startY}px`);
    document.getElementById('game-container').appendChild(enemy);

    let defended = false;
    enemy.onclick = () => {
        defended = true;
        enemy.remove();
        logEvent('成功抵禦敵人，未損失星塵', 'info');
    };

    setTimeout(() => {
        if (!defended) {
            const loss = Math.round(Math.min(stardust, stardust * 0.1 * stage));
            stardust = Math.max(0, stardust - loss);
            logEvent(`敵人襲擊，損失 ${loss} 星塵`, 'loss');
            updateUI(true);
            updateDroneButtonState();
            saveProgress();
        }
        if (!defended) enemy.remove();
    }, 2000);
}

function resourceBoost(multiplier) {
    const boost = Math.round((drones ? drones * droneEff * 5 : 10) * multiplier);
    stardust += boost;
    stageProgress += boost;
    checkStageProgress();
    logEvent(`資源增幅，獲得 ${boost} 星塵`, 'gain');
    updateUI(true);
    updateDroneButtonState();
    saveProgress();
}

function droneMalfunction() {
    if (drones > 0) {
        drones -= 1;
        const children = dronesContainer.children;
        if (children.length > 0) dronesContainer.removeChild(children[children.length - 1]);
        logEvent('無人機故障，損失 1 架無人機', 'loss');
        updateUI(true);
        updateEventInterval();
        updateDroneButtonState();
        saveProgress();
    }
}

function cosmicStorm(multiplier) {
    const loss = Math.round(Math.min(stardust, stardust * 0.2 * multiplier));
    stardust -= loss;
    logEvent(`宇宙風暴，損失 ${loss} 星塵`, 'loss');
    updateUI(true);
    updateDroneButtonState();
    saveProgress();
}

function droneBoost() {
    if (drones < 10) {
        drones += 1;
        createDrone(drones - 1);
        logEvent('無人機增援，獲得 1 架無人機', 'gain');
        updateUI(true);
        updateEventInterval();
        updateDroneButtonState();
        saveProgress();
    }
}

function stardustDoubler() {
    const gain = Math.round(stardust);
    stardust = Math.round(stardust * 2);
    logEvent(`星塵倍增，增加 ${gain} 星塵`, 'gain');
    updateUI(true);
    updateDroneButtonState();
    saveProgress();
}

function startRandomTask() {
    if (!taskActive) {
        taskActive = true;
        taskTimer = 300;
        taskGoal = Math.round(300 * stage * stage);
        logEvent(`新任務：在 ${taskTimer / 60} 分鐘內收集 ${Math.round(taskGoal)} 星塵`, 'info');
        updateUI();
    }
}

function updateTaskTimer() {
    if (taskActive && taskTimer > 0) {
        taskTimer -= 1;
        taskTimerText.textContent = `${Math.floor(taskTimer / 60)}:${(taskTimer % 60).toString().padStart(2, '0')}`;
        if (taskTimer === 0) {
            logEvent('任務失敗：時間到', 'loss');
            taskActive = false;
            taskGoal = 0;
            updateUI();
            setTimeout(startRandomTask, 60000);
        }
    } else if (!taskActive) {
        taskTimerText.textContent = '無';
    }
}

function completeTask() {
    const reward = Math.round(150 * stage * stage);
    stardust += reward;
    taskCount++;
    logEvent(`任務完成，獲得 ${reward} 星塵`, 'gain');
    taskActive = false;
    taskGoal = 0;
    setTimeout(startRandomTask, 60000);
    updateUI(true);
    updateDroneButtonState();
    saveProgress();
}

function updateUI(animate = false) {
    if (animate) {
        stardustText.classList.add('grow');
        setTimeout(() => stardustText.classList.remove('grow'), 300);
    }
    stardustText.textContent = Math.round(stardust);
    dronesText.textContent = drones;
    droneCostText.textContent = Math.round(droneCost);
    droneEffText.textContent = droneEff.toFixed(1);
    droneEffCostText.textContent = Math.round(droneEffCost);
    clickEffText.textContent = clickEff.toFixed(1);
    clickEffCostText.textContent = Math.round(clickEffCost);
    stageText.textContent = stage;
    stageProgressText.textContent = Math.round(stageProgress);
    stageGoalText.textContent = stage - 1 < stageGoals.length ? Math.round(stageGoals[stage - 1]) : '完成';
    clickComboText.textContent = clickCombo;
}

function updateDroneButtonState() {
    droneButton.disabled = stardust < droneCost || drones >= 10;
}

function logEvent(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('p');
    entry.textContent = `[${time}] ${message}`;
    entry.className = type;
    eventLog.insertBefore(entry, eventLog.firstChild);
    eventLog.scrollTop = 0;
    if (eventLog.children.length > 20) eventLog.removeChild(eventLog.lastChild);
}

function saveProgress() {
    const progress = {
        stardust,
        drones,
        droneEff,
        droneEffCost,
        clickEff,
        clickEffCost,
        stage,
        stageProgress,
        clickCombo,
        lastClickTime,
        taskActive,
        taskTimer,
        taskGoal,
        taskCount
    };
    localStorage.setItem('spacePlundererProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('spacePlundererProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        stardust = progress.stardust || 0;
        drones = progress.drones || 0;
        droneEff = progress.droneEff || 1;
        droneEffCost = progress.droneEffCost || 50;
        clickEff = progress.clickEff || 0.5;
        clickEffCost = progress.clickEffCost || 25;
        stage = progress.stage || 1;
        stageProgress = progress.stageProgress || 0;
        clickCombo = progress.clickCombo || 0;
        lastClickTime = progress.lastClickTime || 0;
        taskActive = progress.taskActive || false;
        taskTimer = progress.taskTimer || 0;
        taskGoal = progress.taskGoal || 0;
        taskCount = progress.taskCount || 0;
        droneCost = Math.round(10 * Math.pow(1.15, drones));
        updatePlanetAppearance();
        for (let i = 0; i < drones; i++) {
            createDrone(i);
        }
        for (let i = 1; i < stage; i++) {
            if (stageAbilities[i]) stageAbilities[i]();
        }
        updateUI();
    }
}
