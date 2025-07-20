const state = {
  population: 25,
  power: 0,
  maxPopulation: 25,
  day: 1,
  hour: 10,
  dustStorm: false,
  grid: [],
  surveyTeam: null,
  surveyTeamLabel: null,
  buildTeams: [],
  logisticsTeams: [],
  blueprints: [],
  caches: [],
  materials: {
    solarPrefabs: 20,
    powerLines: 15,
    metalStruts: 10,
    lighting: 10,
    containers: 10,
    tools: 10,
    concrete: 10,
    regolith: 0
  },
  buggies: 2,
  messages: [],
  menuVisible: false,
  menuOptions: ['Solar Array', 'Tunnel Entrance', 'Road', 'Dwelling', 'Wind Turbine', 'Landing Pad'],
  targetX: null,
  targetY: null,
  targetPosX: null,
  targetPosY: null,
  path: null,
  buildMenu: null,
  contextMenu: null,
  contextMenuItems: [],
  bottomMenu: null,
  bottomMenuItems: [],
  topBar: null,
  topBarMenuButton: null,
  topBarMenu: null,
  topBarMenuItems: [],
  topBarTitle: null,
  analysisWindow: null,
  analysisText: null,
  messageLogText: null,
  messageLogScroll: 0,
  starship: null,
  starshipText: null,
  menuY: window.innerHeight,
  menuTargetY: window.innerHeight,
  menuSpeed: 10,
  keys: { w: false, a: false, s: false, d: false },
  statusText: null,
  positionText: null,
  uiContainer: null,
  zoomLevel: 0,
  zoomScales: [1, 1.5, 2],
  landingTile: { x: 9, y: 9 },
  lastWeatherToggle: 0,
  lastDayUpdate: 0,
  lastHourUpdate: 0,
  showTileText: true
};

const config = {
  gridSize: 20,
  tileWidth: 96,
  tileHeight: 48,
  moveSpeed: 38.4,
  logisticsSpeed: 76.8,
  terrainSpeedModifiers: {
    'flats': 1.0,
    'desert': 1.0,
    'hills': 0.6,
    'crater': 0.4,
    'mountains': 0.2
  },
  cameraSpeed: 300,
  buildTime: 30,
  regolithCollectTime: 5,
  cacheSecureTime: 2400,
  messageDisplayTime: 10,
  dayTime: 120,
  hourTime: 10,
  terrainTypes: [
    { type: 'flats', color: 0x9A4F3D, text: 'flats', weight: 1, description: 'Smooth, iron-rich regolith plains, ideal for traversal. These flat expanses allow colonists to move quickly and are perfect for building stable structures.' },
    { type: 'desert', color: 0x8B4513, text: 'desert', weight: 1, description: 'Sandy, wind-swept regolith with loose sediment. Slightly hinders movement due to uneven footing but remains suitable for most construction.' },
    { type: 'hills', color: 0x6A2E1F, text: 'hills', weight: 1, description: 'Rugged, rocky slopes formed by ancient volcanic activity. Moderately difficult to traverse, requiring careful navigation and impacting build efficiency.' },
    { type: 'crater', color: 0x5C2F00, text: 'crater', weight: 0.2, description: 'Deep impact craters with steep rims and loose debris. Very challenging to cross, slowing colonists significantly and complicating construction.' },
    { type: 'mountains', color: 0x4A2C1A, text: 'mountains', weight: 0.2, description: 'Steep, rocky outcrops from ancient tectonic or volcanic processes. Extremely difficult to traverse, severely slowing movement and challenging structural stability.' }
  ],
  structures: {
    'Solar Array': { 
      type: 'solarArray', 
      color: 0xFFD700, 
      text: 'solar', 
      power: 10, 
      description: 'A solar panel array harnessing Mars’ sunlight for power. Built on [terrain], it provides 10 power units, doubled during dust storms.',
      materials: { solarPrefabs: 2, metalStruts: 2, lighting: 1, tools: 1, concrete: 2, powerLines: 1 }
    },
    'Tunnel Entrance': { 
      type: 'tunnelEntrance', 
      color: 0x4682B4, 
      text: 'tunnel', 
      description: 'An entry to subsurface habitats or resource mines. Constructed on [terrain], it facilitates access to underground networks.',
      materials: {}
    },
    'Road': { 
      type: 'road', 
      color: 0x696969, 
      text: 'road', 
      description: 'A reinforced path for efficient colonist movement. Built on [terrain], it improves traversal speed and logistics.',
      materials: { concrete: 1, regolith: 6 }
    },
    'Landing Pad': { 
      type: 'landingPad', 
      color: 0x808080, 
      text: 'landing pad', 
      maxPopulation: 25, 
      description: 'A reinforced pad for spacecraft landings, serving as a central hub for 25 colonists. Located on [terrain], it supports the Starship.',
      materials: { concrete: 2, powerLines: 1, lighting: 4, regolith: 10 }
    },
    'Dwelling': { 
      type: 'dwelling', 
      color: 0x228B22, 
      text: 'dwelling', 
      maxPopulation: 5, 
      description: 'A habitat module housing up to 5 colonists. Built on [terrain], it expands living space for the growing colony.',
      materials: { concrete: 2, regolith: 8, powerLines: 1, lighting: 1 }
    },
    'Wind Turbine': { 
      type: 'windTurbine', 
      color: 0xA9A9A9, 
      text: 'wind', 
      power: 5, 
      description: 'A turbine generating 5 power units, doubled during dust storms. Constructed on [terrain], it’s vital for energy needs.',
      materials: {}
    }
  }
};

function spawnLogisticsTeam(blueprint, buildTeam) {
  if (state.buggies < 1) {
    addMessage('No Mars buggies available for logistics team');
    app.stage.removeChild(buildTeam.sprite);
    app.stage.removeChild(buildTeam.label);
    buildTeam.sprite.destroy();
    buildTeam.label.destroy();
    return null;
  }
  if (state.population - (5 + state.buildTeams.length * 5 + state.logisticsTeams.length * 2) < 2) {
    addMessage('Not enough colonists for logistics team');
    app.stage.removeChild(buildTeam.sprite);
    app.stage.removeChild(buildTeam.label);
    buildTeam.sprite.destroy();
    buildTeam.label.destroy();
    return null;
  }
  state.buggies -= 1;

  const team = new PIXI.Graphics();
  team.beginFill(0x00FF00);
  team.lineStyle(2, 0x000000);
  team.drawCircle(0, 0, 15);
  team.x = state.starship.x;
  team.y = state.starship.y;
  team.zIndex = 200;
  app.stage.addChild(team);

  team.label = new PIXI.Text('Logistics Team', teamLabelStyle);
  team.label.x = team.x;
  team.label.y = team.y + 20;
  team.label.anchor.set(0.5);
  team.label.zIndex = 210;
  app.stage.addChild(team.label);

  buildTeam.sprite.x = team.x;
  buildTeam.sprite.y = team.y;
  buildTeam.label.x = buildTeam.sprite.x;
  buildTeam.label.y = buildTeam.sprite.y + 20;

  const desertTile = findClosestDesertTile(blueprint.x, blueprint.y);
  if (!desertTile) {
    addMessage('No desert tile found for Regolith collection');
    app.stage.removeChild(team);
    app.stage.removeChild(team.label);
    app.stage.removeChild(buildTeam.sprite);
    app.stage.removeChild(buildTeam.label);
    team.destroy();
    team.label.destroy();
    buildTeam.sprite.destroy();
    buildTeam.label.destroy();
    state.buggies += 1;
    return null;
  }

  const targetPosX = (desertTile.x - 9) * config.tileWidth / 2 - (desertTile.y - 9) * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2;
  const targetPosY = (desertTile.x - 9 + desertTile.y - 9) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2;
  const logisticsTeam = { 
    sprite: team, 
    targetX: desertTile.x - 9, 
    targetY: desertTile.y - 9, 
    targetPosX, 
    targetPosY, 
    blueprint, 
    buildTeam, 
    state: 'movingToDesert', 
    label: team.label, 
    materials: { regolith: 0 },
    collectStartTime: 0
  };
  state.logisticsTeams.push(logisticsTeam);
  addMessage(`Logistics team (2 colonists) spawned from Starship for ${blueprint.structure} at (${blueprint.x - 9}, ${blueprint.y - 9})`);
  return logisticsTeam;
}

function spawnBuildTeam(blueprint) {
  const team = new PIXI.Graphics();
  team.beginFill(0x0000FF);
  team.lineStyle(2, 0x000000);
  team.drawCircle(0, 0, 15);
  team.x = state.starship.x;
  team.y = state.starship.y;
  team.zIndex = 200;
  app.stage.addChild(team);

  team.label = new PIXI.Text('Build Team', teamLabelStyle);
  team.label.x = team.x;
  team.label.y = team.y + 20;
  team.label.anchor.set(0.5);
  team.label.zIndex = 210;
  app.stage.addChild(team.label);

  const targetPosX = (blueprint.x - 9) * config.tileWidth / 2 - (blueprint.y - 9) * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2;
  const targetPosY = (blueprint.x - 9 + blueprint.y - 9) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2;
  const buildTeam = { sprite: team, targetX: blueprint.x - 9, targetY: blueprint.y - 9, targetPosX, targetPosY, blueprint, state: 'transported', label: team.label, startTime: 0 };
  state.buildTeams.push(buildTeam);
  return buildTeam;
}

function hasMaterials(structure) {
  const materials = config.structures[structure].materials || {};
  for (let material in materials) {
    if (material !== 'regolith' && state.materials[material] < materials[material]) {
      return false;
    }
  }
  return true;
}

function deductMaterials(structure) {
  const materials = config.structures[structure].materials || {};
  for (let material in materials) {
    if (material !== 'regolith') {
      state.materials[material] -= materials[material];
    }
  }
}

function sendLogisticsTeamToCache(cache) {
  const onMission = 5 + state.buildTeams.length * 5 + state.logisticsTeams.length * 2;
  if (state.population - onMission < 2) {
    addMessage(`Not enough colonists available to spawn logistics team (Need 2, Available: ${state.population - onMission})`);
    return;
  }
  if (state.buggies < 1) {
    addMessage('No Mars buggies available for logistics team');
    return;
  }
  state.buggies -= 1;

  const team = new PIXI.Graphics();
  team.beginFill(0x00FF00);
  team.lineStyle(2, 0x000000);
  team.drawCircle(0, 0, 15);
  team.x = state.starship.x;
  team.y = state.starship.y;
  team.zIndex = 200;
  app.stage.addChild(team);

  team.label = new PIXI.Text('Logistics Team', teamLabelStyle);
  team.label.x = team.x;
  team.label.y = team.y + 20;
  team.label.anchor.set(0.5);
  team.label.zIndex = 210;
  app.stage.addChild(team.label);

  const targetPosX = (cache.x - 9) * config.tileWidth / 2 - (cache.y - 9) * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2;
  const targetPosY = (cache.x - 9 + cache.y - 9) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2;
  state.logisticsTeams.push({
    sprite: team,
    targetX: cache.x - 9,
    targetY: cache.y - 9,
    targetPosX,
    targetPosY,
    cache,
    state: 'movingToCache',
    label: team.label,
    materials: { regolith: 0 },
    collectStartTime: 0
  });
  addMessage(`Logistics team dispatched from Starship to collect cache at (${cache.x - 9}, ${cache.y - 9})`);
}

function updatePower() {
  let totalPower = 0;
  state.grid.forEach(row => row.forEach(tile => {
    const structure = Object.values(config.structures).find(s => s.type === tile.type);
    if (structure && structure.power) {
      totalPower += state.dustStorm && structure.type === 'windTurbine' ? structure.power * 2 : structure.power;
    }
  }));
  state.power = totalPower;
}

function gameLoop(delta) {
  const currentTime = app.ticker.lastTime / 1000;

  // Update time
  if (currentTime - state.lastHourUpdate >= config.hourTime) {
    state.hour = (state.hour + 2) % 24;
    state.lastHourUpdate = currentTime;
    if (state.hour === 0) {
      state.day += 1;
      state.lastDayUpdate = currentTime;
    }
    updateUI();
  }

  // Update weather
  if (currentTime - state.lastWeatherToggle >= 30) {
    state.dustStorm = !state.dustStorm;
    state.lastWeatherToggle = currentTime;
    addMessage(`Weather changed to ${state.dustStorm ? 'Dust Storm' : 'Clear'}`);
    updatePower();
    updateUI();
  }

  // Update survey team
  if (state.surveyTeam.state === 'moving' || state.surveyTeam.state === 'movingToCache') {
    const terrain = getTerrainType(state.surveyTeam.x, state.surveyTeam.y);
    const speed = config.moveSpeed * config.terrainSpeedModifiers[terrain] * delta / 60;
    const dx = state.surveyTeam.targetPosX - state.surveyTeam.x;
    const dy = state.surveyTeam.targetPosY - state.surveyTeam.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > speed) {
      const angle = Math.atan2(dy, dx);
      state.surveyTeam.x += Math.cos(angle) * speed;
      state.surveyTeam.y += Math.sin(angle) * speed;
      state.surveyTeamLabel.x = state.surveyTeam.x;
      state.surveyTeamLabel.y = state.surveyTeam.y + 20;
    } else {
      state.surveyTeam.x = state.surveyTeam.targetPosX;
      state.surveyTeam.y = state.surveyTeam.targetPosY;
      state.surveyTeamLabel.x = state.surveyTeam.x;
      state.surveyTeamLabel.y = state.surveyTeam.y + 20;
      if (state.surveyTeam.state === 'movingToCache') {
        state.surveyTeam.state = 'securingCache';
        state.surveyTeam.startTime = currentTime;
        addMessage(`Survey team securing cache at (${state.surveyTeam.targetX}, ${state.surveyTeam.targetY})`);
      } else {
        state.surveyTeam.state = 'idle';
        if (state.path) {
          app.stage.removeChild(state.path);
          state.path.destroy();
          state.path = null;
        }
      }
    }
    updateUI();
  } else if (state.surveyTeam.state === 'securingCache') {
    if (currentTime - state.surveyTeam.startTime >= config.cacheSecureTime) {
      const cache = state.surveyTeam.targetCache;
      cache.inventoried = true;
      for (let material in cache.resources) {
        state.materials[material] = (state.materials[material] || 0) + cache.resources[material];
      }
      addMessage(`Cache at (${cache.x - 9}, ${cache.y - 9}) inventoried. Resources added.`);
      sendLogisticsTeamToCache(cache);
      state.surveyTeam.state = 'idle';
      state.surveyTeam.targetCache = null;
      updateUI();
    }
  }

  // Update logistics teams
  state.logisticsTeams.forEach((team, index) => {
    const terrain = getTerrainType(team.sprite.x, team.sprite.y);
    const speed = (terrain === 'flats' || terrain === 'desert' ? config.logisticsSpeed : config.moveSpeed * config.terrainSpeedModifiers[terrain]) * delta / 60;
    if (team.state === 'movingToDesert') {
      const dx = team.targetPosX - team.sprite.x;
      const dy = team.targetPosY - team.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > speed) {
        const angle = Math.atan2(dy, dx);
        team.sprite.x += Math.cos(angle) * speed;
        team.sprite.y += Math.sin(angle) * speed;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
        team.buildTeam.sprite.x = team.sprite.x;
        team.buildTeam.sprite.y = team.sprite.y;
        team.buildTeam.label.x = team.buildTeam.sprite.x;
        team.buildTeam.label.y = team.buildTeam.sprite.y + 20;
      } else {
        team.sprite.x = team.targetPosX;
        team.sprite.y = team.targetPosY;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
        team.buildTeam.sprite.x = team.sprite.x;
        team.buildTeam.sprite.y = team.sprite.y;
        team.buildTeam.label.x = team.buildTeam.sprite.x;
        team.buildTeam.label.y = team.buildTeam.sprite.y + 20;
        team.state = 'collectingRegolith';
        team.collectStartTime = currentTime;
        addMessage(`Logistics team collecting Regolith at (${team.targetX}, ${team.targetY})`);
      }
    } else if (team.state === 'collectingRegolith') {
      if (currentTime - team.collectStartTime >= config.regolithCollectTime) {
        team.materials.regolith = 4;
        state.materials.regolith += 4;
        team.state = 'movingToBlueprint';
        team.targetPosX = (team.blueprint.x - 9) * config.tileWidth / 2 - (team.blueprint.y - 9) * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2;
        team.targetPosY = (team.blueprint.x - 9 + team.blueprint.y - 9) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2;
        team.targetX = team.blueprint.x - 9;
        team.targetY = team.blueprint.y - 9;
        addMessage(`Logistics team collected 4 Regolith, moving to blueprint at (${team.targetX}, ${team.targetY})`);
      }
    } else if (team.state === 'movingToBlueprint') {
      const dx = team.targetPosX - team.sprite.x;
      const dy = team.targetPosY - team.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > speed) {
        const angle = Math.atan2(dy, dx);
        team.sprite.x += Math.cos(angle) * speed;
        team.sprite.y += Math.sin(angle) * speed;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
        team.buildTeam.sprite.x = team.sprite.x;
        team.buildTeam.sprite.y = team.sprite.y;
        team.buildTeam.label.x = team.buildTeam.sprite.x;
        team.buildTeam.label.y = team.buildTeam.sprite.y + 20;
      } else {
        team.sprite.x = team.targetPosX;
        team.sprite.y = team.targetPosY;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
        team.buildTeam.sprite.x = team.sprite.x;
        team.buildTeam.sprite.y = team.sprite.y;
        team.buildTeam.label.x = team.buildTeam.sprite.x;
        team.buildTeam.label.y = team.buildTeam.sprite.y + 20;
        team.buildTeam.state = 'building';
        team.buildTeam.startTime = currentTime;
        team.state = 'returning';
        team.targetPosX = state.starship.x;
        team.targetPosY = state.starship.y;
        team.targetX = state.landingTile.x - 9;
        team.targetY = state.landingTile.y - 9;
        addMessage(`Logistics team delivered build team and materials to blueprint at (${team.blueprint.x - 9}, ${team.blueprint.y - 9}), returning to Starship`);
      }
    } else if (team.state === 'returning') {
      const dx = team.targetPosX - team.sprite.x;
      const dy = team.targetPosY - team.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > speed) {
        const angle = Math.atan2(dy, dx);
        team.sprite.x += Math.cos(angle) * speed;
        team.sprite.y += Math.sin(angle) * speed;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
      } else {
        team.sprite.x = state.starship.x;
        team.sprite.y = state.starship.y;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
        app.stage.removeChild(team.sprite);
        app.stage.removeChild(team.label);
        team.sprite.destroy();
        team.label.destroy();
        state.buggies += 1;
        state.logisticsTeams.splice(index, 1);
        addMessage(`Logistics team returned to Starship`);
      }
    } else if (team.state === 'movingToCache') {
      const dx = team.targetPosX - team.sprite.x;
      const dy = team.targetPosY - team.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > speed) {
        const angle = Math.atan2(dy, dx);
        team.sprite.x += Math.cos(angle) * speed;
        team.sprite.y += Math.sin(angle) * speed;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
      } else {
        team.sprite.x = team.targetPosX;
        team.sprite.y = team.targetPosY;
        team.label.x = team.sprite.x;
        team.label.y = team.sprite.y + 20;
        team.state = 'collectingCache';
        team.collectStartTime = currentTime;
        addMessage(`Logistics team collecting cache resources at (${team.targetX}, ${team.targetY})`);
      }
    } else if (team.state === 'collectingCache') {
      if (currentTime - team.collectStartTime >= config.regolithCollectTime) {
        for (let material in team.cache.resources) {
          state.materials[material] = (state.materials[material] || 0) + team.cache.resources[material];
        }
        team.state = 'returning';
        team.targetPosX = state.starship.x;
        team.targetPosY = state.starship.y;
        team.targetX = state.landingTile.x - 9;
        team.targetY = state.landingTile.y - 9;
        addMessage(`Logistics team collected cache resources at (${team.cache.x - 9}, ${team.cache.y - 9}), returning to Starship`);
      }
    }
  });

  // Update build teams
  state.buildTeams.forEach((team, index) => {
    if (team.state === 'building') {
      const blueprint = state.blueprints.find(b => b.x === team.targetX + 9 && b.y === team.targetY + 9);
      if (blueprint) {
        const progress = (currentTime - team.startTime) / config.buildTime;
        blueprint.progress = Math.min(progress, 1);
        blueprint.loadingBar.clear();
        blueprint.loadingBar.beginFill(0xFFFFFF);
        blueprint.loadingBar.drawRect(0, 0, config.tileWidth * blueprint.progress, 5);
        if (progress >= 1) {
          completeBuild(blueprint);
          state.blueprints = state.blueprints.filter(b => b !== blueprint);
          app.stage.removeChild(team.sprite);
          app.stage.removeChild(team.label);
          team.sprite.destroy();
          team.label.destroy();
          state.buildTeams.splice(index, 1);
          addMessage(`Build team completed ${blueprint.structure} at (${team.targetX}, ${team.targetY})`);
        }
      }
    }
  });

  // Update camera
  if (state.keys.w) app.stage.y += config.cameraSpeed * delta / 60;
  if (state.keys.s) app.stage.y -= config.cameraSpeed * delta / 60;
  if (state.keys.a) app.stage.x += config.cameraSpeed * delta / 60;
  if (state.keys.d) app.stage.x -= config.cameraSpeed * delta / 60;

  // Update bottom menu position
  if (state.bottomMenu) {
    state.bottomMenu.y = window.innerHeight / app.stage.scale.y - 100;
    state.bottomMenuItems.forEach((item, index) => {
      item.x = 20 + index * 120;
      item.y = state.bottomMenu.y + 20;
    });
  }
}

// End of file