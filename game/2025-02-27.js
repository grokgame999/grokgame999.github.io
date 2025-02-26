let gold = 0;
let gems = 0;
let clickValue = 1;
let toolCost = 10;
let workers = 0;
let workerCost = 50;
let workerProduction = 1;
let clicks = 0;
let eventActive = false;
let eventClicks = 0;
let eventStartTime = 0;
let doubleIncomeActive = false;
let mysticalBoxActive = false;

let rareItems = {
    legendaryPickaxe: 0, gemCrown: 0, goldenCompass: 0, mysticScroll: 0, starRing: 0,
    dragonScale: 0, elfBlade: 0, timeHourglass: 0, fireOrb: 0, iceHeart: 0
};

let collectibles = []; // 收藏品陣列（僅神聖之光）

const achievements = [
    { id: 'click10', name: '新手挖掘者', condition: () => clicks >= 10, description: '點擊挖掘10次', progress: () => Math.min(clicks / 10, 1), target: 10, reward: 50, achieved: false },
    { id: 'gold100', name: '小富翁', condition: () => gold >= 100, description: '累積100金幣', progress: () => Math.min(gold / 100, 1), target: 100, reward: 100, achieved: false },
    { id: 'worker5', name: '工頭', condition: () => workers >= 5, description: '雇用5個工人', progress: () => Math.min(workers / 5, 1), target: 5, reward: 200, achieved: false },
    { id: 'gems10', name: '寶石收藏家', condition: () => gems >= 10, description: '收集10個寶石', progress: () => Math.min(gems / 10, 1), target: 10, reward: 300, achieved: false },
    { id: 'rare5', name: '寶物獵人', condition: () => Object.values(rareItems).reduce((a, b) => a + b, 0) >= 5, description: '收集5個稀有寶物', progress: () => Math.min(Object.values(rareItems).reduce((a, b) => a + b, 0) / 5, 1), target: 5, reward: 400, achieved: false },
    { id: 'click1000', name: '挖掘狂人', condition: () => clicks >= 1000, description: '點擊挖掘1000次', progress: () => Math.min(clicks / 1000, 1), target: 1000, reward: 600, achieved: false },
    { id: 'gold10000', name: '財富之王', condition: () => gold >= 10000, description: '累積10000金幣', progress: () => Math.min(gold / 10000, 1), target: 10000, reward: 800, achieved: false },
    { id: 'workers20', name: '勞動領袖', condition: () => workers >= 20, description: '雇用20個工人', progress: () => Math.min(workers / 20, 1), target: 20, reward: 1000, achieved: false },
    { id: 'rareAll', name: '傳說收藏家', condition: () => Object.values(rareItems).every(count => count >= 1), description: '收集每種稀有寶物至少1個', progress: () => Object.values(rareItems).filter(count => count >= 1).length / 10, target: 10, reward: 1500, achieved: false }
];

function updateDisplay() {
    const goldSpan = document.getElementById('gold');
    if (goldSpan) {
        goldSpan.innerText = Math.floor(gold);
    } else {
        console.error('Gold element not found!');
    }
    const gemsSpan = document.getElementById('gems');
    if (gemsSpan) {
        gemsSpan.innerText = Math.floor(gems);
    }
    document.getElementById('toolCost').innerText = toolCost;
    document.getElementById('workerCost').innerText = workerCost;
    document.getElementById('workers').innerText = workers;
    document.getElementById('workerEfficiency').innerText = workerProduction.toFixed(1);
    document.getElementById('legendaryPickaxe').innerText = rareItems.legendaryPickaxe;
    document.getElementById('gemCrown').innerText = rareItems.gemCrown;
    document.getElementById('goldenCompass').innerText = rareItems.goldenCompass;
    document.getElementById('mysticScroll').innerText = rareItems.mysticScroll;
    document.getElementById('starRing').innerText = rareItems.starRing;
    document.getElementById('dragonScale').innerText = rareItems.dragonScale;
    document.getElementById('elfBlade').innerText = rareItems.elfBlade;
    document.getElementById('timeHourglass').innerText = rareItems.timeHourglass;
    document.getElementById('fireOrb').innerText = rareItems.fireOrb;
    document.getElementById('iceHeart').innerText = rareItems.iceHeart;
    document.getElementById('holyLight').innerText = collectibles.filter(item => item === '神聖之光').length;
    updateAchievements();
    updateClickAreaVisual();
    updateMysticalBox();
}

function updateClickAreaVisual() {
    const area = document.getElementById('click-area');
    if (clickValue >= 10) {
        area.style.backgroundColor = '#d4a017';
        area.innerText = '高級挖掘';
    } else if (clickValue >= 5) {
        area.style.backgroundColor = '#a6713c';
        area.innerText = '中級挖掘';
    } else {
        area.style.backgroundColor = '#8b5a2b';
        area.innerText = '點擊挖掘';
    }
}

function updateMysticalBox() {
    const box = document.getElementById('mystical-box');
    if (mysticalBoxActive) {
        box.style.display = 'block';
        document.getElementById('mystical-text').innerText = '你發現了一個神秘寶箱！點擊開啟！';
    } else {
        box.style.display = 'none';
    }
}

function dig() {
    const multiplier = doubleIncomeActive ? 2 : 1;
    gold += clickValue * multiplier;
    clicks += 1;
    if (eventActive) {
        eventClicks += 1;
        if (eventClicks >= 20 && (Date.now() - eventStartTime) <= 10000) {
            claimEventReward(500);
        }
    }
    if (Math.random() < 0.05) {
        gems += 1;
        const gem = document.createElement('div');
        gem.innerText = '+1';
        gem.className = 'gem-effect';
        // 隨機分布在 .game-container 內
        const container = document.querySelector('.game-container');
        const containerRect = container.getBoundingClientRect();
        gem.style.left = `${Math.random() * containerRect.width}px`;
        gem.style.top = `${Math.random() * (containerRect.height - 50)}px`; // 減去動畫高度避免溢出
        gem.style.fontSize = '1.5rem';
        container.appendChild(gem);
        setTimeout(() => gem.remove(), 1000);
    }
    const coin = document.createElement('div');
    coin.innerText = `+${Math.floor(clickValue * multiplier)}`;
    coin.className = 'coin-effect';
    const container = document.querySelector('.game-container');
    const containerRect = container.getBoundingClientRect();
    coin.style.left = `${Math.random() * containerRect.width}px`;
    coin.style.top = `${Math.random() * (containerRect.height - 50)}px`;
    coin.style.fontSize = '1.5rem';
    container.appendChild(coin);
    setTimeout(() => coin.remove(), 700);

    // 隨機獎勵（每 100 次點擊 5% 機率）
    if (clicks % 100 === 0 && Math.random() < 0.05) {
        const reward = Math.random() < 0.5 ? { gold: 1000, msg: '獲得1000金幣！' } : { gems: 5, msg: '獲得5寶石！' };
        gold += reward.gold || 0;
        gems += reward.gems || 0;
        alert(reward.msg);
    }

    // 稀有寶物掉落（1% 機率）
    const rand = Math.random();
    if (rand < 0.01) {
        const items = [
            { key: 'legendaryPickaxe', name: '傳說鎬', effect: 'legendary-effect', bonus: () => clickValue *= 1.5 },
            { key: 'gemCrown', name: '寶石王冠', effect: 'crown-effect', bonus: () => gems += 10 },
            { key: 'goldenCompass', name: '黃金羅盤', effect: 'compass-effect', bonus: () => gold += 1000 },
            { key: 'mysticScroll', name: '神秘卷軸', effect: 'scroll-effect', bonus: () => workerProduction *= 1.2 },
            { key: 'starRing', name: '星辰戒指', effect: 'ring-effect', bonus: () => clickValue *= 1.1 },
            { key: 'dragonScale', name: '龍鱗護符', effect: 'scale-effect', bonus: () => workers += 5 },
            { key: 'elfBlade', name: '精靈之刃', effect: 'blade-effect', bonus: () => clickValue *= 1.3 },
            { key: 'timeHourglass', name: '時間沙漏', effect: 'hourglass-effect', bonus: () => workerProduction *= 1.5 },
            { key: 'fireOrb', name: '火焰寶珠', effect: 'orb-effect', bonus: () => gold += 2000 },
            { key: 'iceHeart', name: '冰霜之心', effect: 'heart-effect', bonus: () => gems += 20 }
        ];
        const item = items[Math.floor(Math.random() * items.length)];
        rareItems[item.key]++;
        item.bonus();
        const effect = document.createElement('div');
        effect.innerText = item.name;
        effect.className = item.effect;
        const container = document.querySelector('.game-container');
        const containerRect = container.getBoundingClientRect();
        effect.style.left = `${Math.random() * containerRect.width}px`;
        effect.style.top = `${Math.random() * (containerRect.height - 50)}px`;
        effect.style.fontSize = '1.5rem';
        effect.style.textShadow = '0 0 0.75rem currentColor';
        container.appendChild(effect);
        setTimeout(() => effect.remove(), 1200);
        alert(`獲得稀有寶物：${item.name}！`);
    }

    // 神秘寶箱（1% 機率）
    if (Math.random() < 0.01 && !mysticalBoxActive) {
        mysticalBoxActive = true;
        updateDisplay();
    }
    updateDisplay();
}

function upgradeTool() {
    if (gold >= toolCost) {
        gold -= toolCost;
        clickValue += 1;
        toolCost = Math.floor(toolCost * 1.5);
        updateDisplay();
        saveGame();
    } else {
        alert('金幣不足！');
    }
}

function hireWorker() {
    if (gold >= workerCost) {
        gold -= workerCost;
        workers += 1;
        workerCost = Math.floor(workerCost * 1.5);
        updateDisplay();
        saveGame();
    } else {
        alert('金幣不足！');
    }
}

function buySpecialUpgrade() {
    if (gems >= 10) {
        gems -= 10;
        workerProduction *= 2;
        const btn = document.getElementById('specialUpgradeBtn');
        btn.classList.add('glow');
        setTimeout(() => btn.classList.remove('glow'), 1000);
        updateDisplay();
        saveGame();
        alert('特殊升級完成！工人效率加倍！');
    } else {
        alert('寶石不足！需要10個寶石來提升工人效率。');
    }
}

function openMysticalBox() {
    if (mysticalBoxActive) {
        const rewards = [
            { gold: 5000, msg: '神秘寶箱：獲得5000金幣！' },
            { gems: 20, msg: '神秘寶箱：獲得20寶石！' },
            { rare: '神聖之光', msg: '神秘寶箱：獲得稀有收藏品神聖之光！點擊效率提升5%！', bonus: () => clickValue *= 1.05 }
        ];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        gold += reward.gold || 0;
        gems += reward.gems || 0;
        if (reward.rare) {
            collectibles.push(reward.rare);
            if (reward.bonus) reward.bonus();
            updateAchievements();
        }
        alert(reward.msg);
        mysticalBoxActive = false;
        updateDisplay();
        saveGame();
    }
}

setInterval(() => {
    const multiplier = doubleIncomeActive ? 2 : 1;
    gold += workers * workerProduction * multiplier;
    updateDisplay();
}, 1000);

setInterval(() => {
    if (!eventActive && Math.random() < 0.1) {
        eventActive = true;
        eventClicks = 0;
        eventStartTime = Date.now();
        const eventDiv = document.getElementById('event');
        eventDiv.style.display = 'block';
        const goldSpan = document.getElementById('gold');
        goldSpan.classList.add('flash');
        const eventType = Math.random() < 0.5 ? 'click' : 'double';
        if (eventType === 'click') {
            document.getElementById('event-text').innerText = '限時任務：在10秒內點擊20次，獲得500金幣！';
            setTimeout(() => {
                eventActive = false;
                eventDiv.style.display = 'none';
                eventClicks = 0;
                goldSpan.classList.remove('flash');
                updateDisplay();
            }, 10000);
        } else {
            document.getElementById('event-text').innerText = '限時事件：接下來30秒收益雙倍！';
            doubleIncomeActive = true;
            setTimeout(() => {
                eventActive = false;
                doubleIncomeActive = false;
                eventDiv.style.display = 'none';
                goldSpan.classList.remove('flash');
                updateDisplay();
            }, 30000);
        }
        updateDisplay();
    }
}, 30000);

function claimEventReward(reward) {
    if (eventActive && eventClicks >= 20 && (Date.now() - eventStartTime) <= 10000) {
        gold += reward;
        eventActive = false;
        eventClicks = 0;
        document.getElementById('event').style.display = 'none';
        document.getElementById('gold').classList.remove('flash');
        updateDisplay();
        saveGame();
    }
}

function updateAchievements() {
    const list = document.getElementById('achievement-list');
    list.innerHTML = '';
    achievements.forEach(ach => {
        if (!ach.achieved && ach.condition()) {
            ach.achieved = true;
            gold += ach.reward;
            alert(`達成成就：${ach.name}！獎勵：${ach.reward}金幣`);
        }
        const li = document.createElement('li');
        li.innerText = `${ach.name} (${ach.description}): ${ach.achieved ? '已完成' : '未完成'}`;
        if (!ach.achieved) {
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            const progress = document.createElement('div');
            progress.className = 'progress';
            progress.style.width = `${ach.progress() * 100}%`;
            progressBar.appendChild(progress);
            li.appendChild(progressBar);
        }
        list.appendChild(li);
    });
}

function saveGame() {
    const gameData = { gold, gems, clickValue, toolCost, workers, workerCost, workerProduction, clicks, rareItems, collectibles, mysticalBoxActive, achievements };
    localStorage.setItem('treasureHunterSave', JSON.stringify(gameData));
}

function loadGame() {
    const savedData = localStorage.getItem('treasureHunterSave');
    if (savedData) {
        const data = JSON.parse(savedData);
        gold = data.gold || 0;
        gems = data.gems || 0;
        clickValue = data.clickValue || 1;
        toolCost = data.toolCost || 10;
        workers = data.workers || 0;
        workerCost = data.workerCost || 50;
        workerProduction = data.workerProduction || 1;
        clicks = data.clicks || 0;
        rareItems = data.rareItems || {
            legendaryPickaxe: 0, gemCrown: 0, goldenCompass: 0, mysticScroll: 0, starRing: 0,
            dragonScale: 0, elfBlade: 0, timeHourglass: 0, fireOrb: 0, iceHeart: 0
        };
        collectibles = data.collectibles || [];
        mysticalBoxActive = data.mysticalBoxActive || false;
        if (data.achievements) {
            data.achievements.forEach((savedAch, i) => {
                achievements[i].achieved = savedAch.achieved;
            });
        }
    }
    updateDisplay();
}

// 初始化
loadGame();
