function findClosestDesertTile(x, y) {
  let closest = null;
  let minDistance = Infinity;
  for (let i = 0; i < config.gridSize; i++) {
    for (let j = 0; j < config.gridSize; j++) {
      if (state.grid[i][j].terrainType === 'desert') {
        const dist = Math.abs(i - x) + Math.abs(j - y);
        if (dist < minDistance) {
          minDistance = dist;
          closest = { x: i, y: j };
        }
      }
    }
  }
  return closest;
}

function findClosestCache(x, y) {
  let closest = null;
  let minDistance = Infinity;
  state.caches.forEach(cache => {
    if (!cache.inventoried) {
      const dist = Math.abs(cache.x - x) + Math.abs(cache.y - y);
      if (dist < minDistance) {
        minDistance = dist;
        closest = cache;
      }
    }
  });
  return closest;
}

function getGridPosition(x, y) {
  const posX = (x - window.innerWidth / 2 - config.tileWidth / 2) / app.stage.scale.x;
  const posY = (y - window.innerHeight / 2 - config.tileHeight / 2) / app.stage.scale.y;
  const gridX = Math.round((posX / (config.tileWidth / 2) + posY / (config.tileHeight / 2)) / 2) + 9;
  const gridY = Math.round((posY / (config.tileHeight / 2) - posX / (config.tileWidth / 2)) / 2) + 9;
  return { x: gridX, y: gridY };
}

function getTerrainType(x, y) {
  const { x: gridX, y: gridY } = getGridPosition(x, y);
  if (gridX >= 0 && gridX < config.gridSize && gridY >= 0 && gridY < config.gridSize) {
    return state.grid[gridX][gridY].terrainType;
  }
  return 'flats';
}

function getTileDescription(tile) {
  let description;
  if (tile.type === 'blueprint') {
    const blueprint = state.blueprints.find(b => b.x === tile.relativeX + 9 && b.y === tile.relativeY + 9);
    if (blueprint) {
      const structure = config.structures[blueprint.structure];
      const terrainDesc = config.terrainTypes.find(t => t.type === tile.terrainType)?.description || 'unknown terrain';
      description = `A blueprint for a ${blueprint.structure} on ${tile.terrainType}. Under construction, to be completed in 30 seconds.`;
    }
  } else {
    const structure = Object.values(config.structures).find(s => s.type === tile.type);
    if (structure) {
      description = structure.description.replace('[terrain]', tile.terrainType);
    } else {
      const terrain = config.terrainTypes.find(t => t.type === tile.terrainType);
      description = terrain ? terrain.description : 'Unknown terrain';
    }
    const cache = state.caches.find(c => c.x === tile.relativeX + 9 && c.y === tile.relativeY + 9);
    if (cache) {
      description += `\nSupply Cache: ${cache.inventoried ? 'Inventoried' : 'Uninventoried'}. Contains 5 Solar Prefabs, 5 Power Lines, 5 Metal Struts, 5 Lighting, 5 Containers, 5 Tools, 5 Concrete.`;
    }
  }
  const metrics = PIXI.TextMetrics.measureText(description, new PIXI.TextStyle(analysisTextStyle));
  const textHeight = metrics.height + 20;
  return { description, height: Math.max(104, textHeight) };
}

function placeBlueprint(option, relativeX, relativeY) {
  const onMission = 5 + state.buildTeams.length * 5 + state.logisticsTeams.length * 2;
  if (state.population - onMission < 7) {
    addMessage(`Not enough colonists available to spawn teams (Need 7, Available: ${state.population - onMission})`);
    return;
  }
  if (state.buggies < 1) {
    addMessage('No Mars buggies available for logistics team');
    return;
  }

  const structure = config.structures[option];
  if (!structure) {
    addMessage(`Invalid structure: ${option}`);
    return;
  }

  if (!hasMaterials(option)) {
    addMessage(`Insufficient materials for ${option}`);
    return;
  }

  const gridX = relativeX + 9;
  const gridY = relativeY + 9;

  if (gridX < 0 || gridX >= config.gridSize || gridY < 0 || gridY >= config.gridSize) {
    addMessage(`Invalid grid coordinates: (${gridX}, ${gridY})`);
    return;
  }

  const tile = state.grid[gridX][gridY];
  if (tile.type !== 'flats' && tile.type !== 'desert' && tile.type !== 'hills' && tile.type !== 'crater' && tile.type !== 'mountains') {
    addMessage(`Cannot place blueprint on non-terrain tile at (${relativeX}, ${relativeY})`);
    return;
  }

  tile.type = 'blueprint';
  tile.color = 0x0000FF;
  tile.sprite.clear();
  tile.sprite.beginFill(0x0000FF, 0.5);
  tile.sprite.lineStyle(2, 0x333333);
  tile.sprite.drawPolygon([
    0, config.tileHeight / 2,
    config.tileWidth / 2, 0,
    config.tileWidth, config.tileHeight / 2,
    config.tileWidth / 2, config.tileHeight
  ]);
  tile.text.text = `${structure.text}\nBlueprint`;
  tile.text.visible = state.showTileText;

  const loadingBar = new PIXI.Graphics();
  loadingBar.x = tile.x;
  loadingBar.y = tile.y + config.tileHeight / 2 + 10;
  loadingBar.beginFill(0xFFFFFF);
  loadingBar.drawRect(0, 0, 0, 5);
  loadingBar.zIndex = 100;
  app.stage.addChild(loadingBar);

  state.blueprints.push({ x: gridX, y: gridY, structure: option, progress: 0, loadingBar });
  deductMaterials(option);
  const buildTeam = spawnBuildTeam({ x: gridX, y: gridY, structure: option });
  if (buildTeam) {
    const logisticsTeam = spawnLogisticsTeam({ x: gridX, y: gridY, structure: option }, buildTeam);
    if (!logisticsTeam) {
      state.buildTeams = state.buildTeams.filter(t => t !== buildTeam);
    } else {
      addMessage(`Placed ${structure.text} blueprint at (${relativeX}, ${relativeY})`);
    }
  }
}

function placeBuilding(option) {
  const { x: gridX, y: gridY } = getGridPosition(state.surveyTeam.x, state.surveyTeam.y);
  placeBlueprint(option, gridX - 9, gridY - 9);
}

function handleTileClick(event, x, y) {
  if (state.contextMenu || state.topBarMenu) {
    closeContextMenu();
    closeTopBarMenu();
  }

  const cache = state.caches.find(c => c.x === x + 9 && c.y === y + 9 && !c.inventoried);
  if (cache) {
    state.surveyTeam.state = 'movingToCache';
    state.surveyTeam.targetCache = cache;
    state.surveyTeam.targetX = x;
    state.surveyTeam.targetY = y;
    state.surveyTeam.targetPosX = (x * config.tileWidth / 2 - y * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2);
    state.surveyTeam.targetPosY = ((x + y) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2);
    state.surveyTeam.startTime = app.ticker.lastTime / 1000;
    addMessage(`Survey team moving to cache at (${x}, ${y})`);
  } else {
    state.surveyTeam.state = 'moving';
    state.surveyTeam.targetX = x;
    state.surveyTeam.targetY = y;
    state.surveyTeam.targetPosX = (x * config.tileWidth / 2 - y * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2);
    state.surveyTeam.targetPosY = ((x + y) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2);
  }

  if (state.path) {
    app.stage.removeChild(state.path);
    state.path.destroy();
    state.path = null;
  }

  state.path = new PIXI.Graphics();
  state.path.lineStyle(2 / app.stage.scale.x, 0xFFFFFF, 1);
  state.path.moveTo(state.surveyTeam.x, state.surveyTeam.y);
  state.path.lineTo(state.surveyTeam.targetPosX, state.surveyTeam.targetPosY);
  state.path.zIndex = 150;
  app.stage.addChild(state.path);
}

// End of file