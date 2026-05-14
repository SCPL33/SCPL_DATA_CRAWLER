const state = {
  day: 1,
  cash: 2500,
  rawMaterial: 60,
  finishedGoods: 0,
  reputation: 50,
  machineHealth: 82,
  machineLevel: 1,
  storageLevel: 1,
  qualityLevel: 1,
  score: 1800,
  acceptedContract: null,
  currentContract: null,
  event: null,
  log: []
};

const contracts = [
  { customer: "Local Retailer", units: 45, revenue: 1250, material: 36, difficulty: "Safe", export: false },
  { customer: "Regional Distributor", units: 80, revenue: 2600, material: 70, difficulty: "Balanced", export: false },
  { customer: "Gulf Export Buyer", units: 110, revenue: 4300, material: 96, difficulty: "Risky", export: true },
  { customer: "European Industrial Client", units: 150, revenue: 6600, material: 132, difficulty: "Elite", export: true }
];

const events = [
  { name: "Fuel Price Rise", text: "Freight rates jumped. Export dispatch rewards are higher, but failed deliveries hurt reputation.", materialPrice: 1.05, exportBonus: 1.16 },
  { name: "Raw Material Dip", text: "Suppliers are discounting chemicals today. This is a good time to buy inventory.", materialPrice: 0.72, exportBonus: 1 },
  { name: "Machine Crisis", text: "Factories report breakdowns across the sector. Keep health above 45 before scaling production.", materialPrice: 1, exportBonus: 1.05 },
  { name: "Export Boom", text: "Global demand is strong. Export contracts pay extra leaderboard points this week.", materialPrice: 1.12, exportBonus: 1.28 }
];

const upgrades = [
  {
    key: "machineLevel",
    title: "Machine Speed",
    description: "Increase output per production run.",
    cost: () => state.machineLevel * 1200,
    max: 5
  },
  {
    key: "storageLevel",
    title: "Storage Capacity",
    description: "Hold more raw material and finished goods.",
    cost: () => state.storageLevel * 900,
    max: 5
  },
  {
    key: "qualityLevel",
    title: "Quality Lab",
    description: "Reduce rejection risk and improve customer trust.",
    cost: () => state.qualityLevel * 1000,
    max: 5
  }
];

const competitors = [
  { name: "Atlas Manufacturing", score: 4200 },
  { name: "Nexus Exports", score: 3600 },
  { name: "Quantum Plastics", score: 3100 },
  { name: "BluePeak Factory", score: 2600 }
];

const elements = {
  statsGrid: document.querySelector("#statsGrid"),
  eventBanner: document.querySelector("#eventBanner"),
  advisorMessage: document.querySelector("#advisorMessage"),
  contractCard: document.querySelector("#contractCard"),
  upgradeList: document.querySelector("#upgradeList"),
  leaderboard: document.querySelector("#leaderboard"),
  activityLog: document.querySelector("#activityLog"),
  buyMaterialBtn: document.querySelector("#buyMaterialBtn"),
  produceBtn: document.querySelector("#produceBtn"),
  qualityBtn: document.querySelector("#qualityBtn"),
  dispatchBtn: document.querySelector("#dispatchBtn"),
  acceptContractBtn: document.querySelector("#acceptContractBtn"),
  newContractBtn: document.querySelector("#newContractBtn")
};

function money(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

function capacity() {
  return 120 + state.storageLevel * 80;
}

function materialPrice() {
  return Math.round(30 * state.event.materialPrice);
}

function pickContract() {
  const index = Math.min(contracts.length - 1, Math.floor(Math.random() * contracts.length + state.reputation / 55));
  state.currentContract = { ...contracts[index] };
}

function rotateEvent() {
  state.event = events[Math.floor(Math.random() * events.length)];
}

function addLog(message) {
  state.log.push(`Day ${state.day}: ${message}`);
  state.log = state.log.slice(-10);
}

function advisorText() {
  if (state.machineHealth < 45) {
    return "Machine health is low. Run fewer batches or upgrade maintenance before accepting a risky export order.";
  }

  if (state.event.name === "Raw Material Dip" && state.cash > materialPrice() * 25) {
    return "Raw material is discounted today. Buy inventory now if storage capacity is available.";
  }

  if (state.acceptedContract && state.finishedGoods >= state.acceptedContract.units) {
    return "Finished goods are ready. Dispatch now to convert inventory into cash and leaderboard points.";
  }

  if (state.currentContract?.export && state.event.exportBonus > 1.1) {
    return "Export demand is hot. Accepting this global order can boost profit and reputation if you can supply it.";
  }

  return "Focus on a balanced loop: buy material, produce goods, quality check, dispatch, then reinvest profits into upgrades.";
}

function renderStats() {
  const stats = [
    ["Cash", money(state.cash)],
    ["Raw Material", `${state.rawMaterial}/${capacity()}`],
    ["Finished Goods", `${state.finishedGoods}/${capacity()}`],
    ["Machine Health", `${state.machineHealth}%`],
    ["Reputation", `${state.reputation}/100`],
    ["Material Price", money(materialPrice())],
    ["Accepted Order", state.acceptedContract ? `${state.acceptedContract.units} units` : "None"],
    ["Arena Score", state.score.toLocaleString()]
  ];

  elements.statsGrid.innerHTML = stats
    .map(([label, value]) => `
      <article class="stat-card">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
      </article>
    `)
    .join("");
}

function renderContract() {
  const contract = state.currentContract;
  elements.contractCard.innerHTML = `
    <h3>${contract.customer}</h3>
    <div class="contract-meta">
      <span>Units<strong>${contract.units}</strong></span>
      <span>Revenue<strong>${money(contract.revenue * (contract.export ? state.event.exportBonus : 1))}</strong></span>
      <span>Material Needed<strong>${contract.material}</strong></span>
      <span>Risk<strong>${contract.difficulty}</strong></span>
    </div>
  `;
}

function renderUpgrades() {
  elements.upgradeList.innerHTML = upgrades
    .map((upgrade) => {
      const level = state[upgrade.key];
      const isMax = level >= upgrade.max;
      return `
        <article class="upgrade-card">
          <div>
            <h3>${upgrade.title} Lv.${level}</h3>
            <p>${upgrade.description}</p>
            <div class="upgrade-meta"><span>Cost<strong>${isMax ? "Maxed" : money(upgrade.cost())}</strong></span></div>
          </div>
          <button data-upgrade="${upgrade.key}" ${isMax ? "disabled" : ""}>Upgrade</button>
        </article>
      `;
    })
    .join("");
}

function renderLeaderboard() {
  const board = [...competitors, { name: "Your Factory", score: state.score }]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => `
      <li><strong>#${index + 1} ${entry.name}</strong> — ${entry.score.toLocaleString()} pts</li>
    `)
    .join("");

  elements.leaderboard.innerHTML = board;
}

function renderLog() {
  elements.activityLog.innerHTML = state.log.map((item) => `<li>${item}</li>`).join("");
}

function render() {
  elements.eventBanner.textContent = `${state.event.name}: ${state.event.text}`;
  elements.advisorMessage.textContent = advisorText();
  renderStats();
  renderContract();
  renderUpgrades();
  renderLeaderboard();
  renderLog();

  elements.produceBtn.disabled = state.rawMaterial < 10;
  elements.qualityBtn.disabled = state.finishedGoods <= 0;
  elements.dispatchBtn.disabled = !state.acceptedContract || state.finishedGoods < state.acceptedContract.units;
  elements.acceptContractBtn.disabled = Boolean(state.acceptedContract);
}

function advanceDay() {
  state.day += 1;
  state.machineHealth = Math.max(5, state.machineHealth - Math.floor(Math.random() * 7));
  competitors.forEach((competitor) => {
    competitor.score += Math.floor(160 + Math.random() * 520);
  });

  if (state.day % 3 === 0) {
    rotateEvent();
    addLog(`Market event changed to ${state.event.name}.`);
  }
}

function buyMaterial() {
  const quantity = 25;
  const cost = quantity * materialPrice();

  if (state.cash < cost) {
    addLog("Purchase failed because working capital is too low.");
    render();
    return;
  }

  if (state.rawMaterial + quantity > capacity()) {
    addLog("Storage is full. Upgrade capacity before buying more raw material.");
    render();
    return;
  }

  state.cash -= cost;
  state.rawMaterial += quantity;
  addLog(`Bought ${quantity} raw material for ${money(cost)}.`);
  advanceDay();
  render();
}

function runProduction() {
  const materialUsed = 10 + state.machineLevel * 4;
  const goodsProduced = 8 + state.machineLevel * 6;

  if (state.rawMaterial < materialUsed) {
    addLog("Not enough raw material to run the production line.");
    render();
    return;
  }

  if (state.finishedGoods + goodsProduced > capacity()) {
    addLog("Finished goods warehouse is full. Dispatch or upgrade storage.");
    render();
    return;
  }

  const breakdownRisk = state.event.name === "Machine Crisis" ? 0.28 : 0.12;
  state.rawMaterial -= materialUsed;
  state.finishedGoods += goodsProduced;
  state.machineHealth -= Math.floor(4 + Math.random() * 8);

  if (Math.random() < breakdownRisk && state.machineHealth < 60) {
    const repairCost = 350;
    state.cash = Math.max(0, state.cash - repairCost);
    state.machineHealth = Math.min(100, state.machineHealth + 18);
    addLog(`Breakdown repaired for ${money(repairCost)} after a tough production run.`);
  } else {
    addLog(`Produced ${goodsProduced} units using ${materialUsed} raw material.`);
  }

  advanceDay();
  render();
}

function qualityCheck() {
  const rejectionChance = Math.max(0.04, 0.22 - state.qualityLevel * 0.035 - state.reputation * 0.001);
  const inspected = Math.min(state.finishedGoods, 35 + state.qualityLevel * 10);

  if (Math.random() < rejectionChance) {
    const rejected = Math.ceil(inspected * 0.22);
    state.finishedGoods = Math.max(0, state.finishedGoods - rejected);
    state.reputation = Math.max(0, state.reputation - 3);
    addLog(`Quality check rejected ${rejected} units. Improve the lab to reduce waste.`);
  } else {
    state.reputation = Math.min(100, state.reputation + 2);
    state.score += 120;
    addLog(`Quality check passed. Reputation improved to ${state.reputation}.`);
  }

  advanceDay();
  render();
}

function acceptContract() {
  state.acceptedContract = { ...state.currentContract };
  pickContract();
  addLog(`Accepted order from ${state.acceptedContract.customer}.`);
  render();
}

function scoutNewLead() {
  const scoutCost = 160;
  if (state.cash >= scoutCost) {
    state.cash -= scoutCost;
    pickContract();
    addLog(`Sales team scouted a fresh customer lead for ${money(scoutCost)}.`);
  } else {
    addLog("Not enough cash to scout a new lead.");
  }
  render();
}

function dispatchOrder() {
  const contract = state.acceptedContract;
  const freightCost = contract.export ? 420 : 180;
  const payout = Math.round(contract.revenue * (contract.export ? state.event.exportBonus : 1));

  state.finishedGoods -= contract.units;
  state.cash += payout - freightCost;
  state.reputation = Math.min(100, state.reputation + (contract.export ? 5 : 3));
  state.score += Math.round(payout / 2 + state.reputation * 8);
  addLog(`Dispatched ${contract.units} units to ${contract.customer}. Net cash gained: ${money(payout - freightCost)}.`);
  state.acceptedContract = null;
  advanceDay();
  render();
}

function upgradeFactory(key) {
  const upgrade = upgrades.find((item) => item.key === key);
  const cost = upgrade.cost();

  if (state.cash < cost) {
    addLog(`Upgrade failed. ${upgrade.title} needs ${money(cost)}.`);
    render();
    return;
  }

  state.cash -= cost;
  state[key] += 1;
  state.score += 250;

  if (key === "machineLevel") {
    state.machineHealth = Math.min(100, state.machineHealth + 12);
  }

  addLog(`${upgrade.title} upgraded to level ${state[key]}.`);
  render();
}

function bindEvents() {
  elements.buyMaterialBtn.addEventListener("click", buyMaterial);
  elements.produceBtn.addEventListener("click", runProduction);
  elements.qualityBtn.addEventListener("click", qualityCheck);
  elements.dispatchBtn.addEventListener("click", dispatchOrder);
  elements.acceptContractBtn.addEventListener("click", acceptContract);
  elements.newContractBtn.addEventListener("click", scoutNewLead);
  elements.upgradeList.addEventListener("click", (event) => {
    const key = event.target.dataset.upgrade;
    if (key) {
      upgradeFactory(key);
    }
  });
}

function bootGame() {
  rotateEvent();
  pickContract();
  addLog("Factory opened with one production line and a small startup budget.");
  bindEvents();
  render();
}

bootGame();
