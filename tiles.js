function createTile(x, y) {
  const relativeX = x - 9;
  const relativeY = y - 9;
  const terrain = x === 9 && y === 9 ? config.structures['Landing Pad'] : getRandomTerrain();
  const tile = new PIXI.Graphics();
  const structure = Object.values(config.structures).find(s => s.type === terrain.type);
  const color = structure ? structure.color : terrain.color;
  tile.beginFill(color);
  tile.lineStyle(2, 0x333333);
  tile.drawPolygon([
    0, config.tileHeight / 2,
    config.tileWidth / 2, 0,
    config.tileWidth, config.tileHeight / 2,
    config.tileWidth / 2, config.tileHeight
  ]);
  const posX = relativeX * config.tileWidth / 2 - relativeY * config.tileWidth / 2;
  const posY = (relativeX + relativeY) * config.tileHeight / 2;
  tile.x = posX + window.innerWidth / 2;
  tile.y = posY + window.innerHeight / 2;
  tile.interactive = true;
  tile.buttonMode = true;
  tile.on('click', (event) => handleTileClick(event, relativeX, relativeY));
  tile.on('rightclick', (event) => openContextMenu(event, relativeX, relativeY));

  const text = new PIXI.Text(terrain.text, { ...tileTextStyle });
  text.x = tile.x + config.tileWidth / 2;
  text.y = tile.y + config.tileHeight / 2;
  text.anchor.set(0.5);
  text.zIndex = 10;
  text.visible = state.showTileText;

  app.stage.addChild(tile);
  app.stage.addChild(text);
  return { sprite: tile, text: text, type: terrain.type, terrainType: terrain.type, relativeX, relativeY, color };
}

function getRandomTerrain() {
  const totalWeight = config.terrainTypes.reduce((sum, t) => sum + (t.weight || 1), 0);
  let rand = Math.random() * totalWeight;
  for (let terrain of config.terrainTypes) {
    rand -= terrain.weight || 1;
    if (rand <= 0) return terrain;
  }
  return config.terrainTypes[0];
}

function createCaches() {
  const cacheCount = 5;
  const usedPositions = [{ x: 9, y: 9 }];
  for (let i = 0; i < cacheCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * config.gridSize);
      y = Math.floor(Math.random() * config.gridSize);
    } while (usedPositions.some(pos => pos.x === x && pos.y === y));
    usedPositions.push({ x, y });

    const cache = new PIXI.Graphics();
    cache.beginFill(0x808080);
    cache.lineStyle(2, 0x000000);
    cache.drawRect(-15, -7.5, 30, 15);
    const posX = (x - 9) * config.tileWidth / 2 - (y - 9) * config.tileWidth / 2 + window.innerWidth / 2 + config.tileWidth / 2;
    const posY = (x - 9 + y - 9) * config.tileHeight / 2 + window.innerHeight / 2 + config.tileHeight / 2;
    cache.x = posX;
    cache.y = posY;
    cache.zIndex = 100;
    app.stage.addChild(cache);

    const cacheText = new PIXI.Text('Cache', { ...tileTextStyle });
    cacheText.x = cache.x;
    cacheText.y = cache.y;
    cacheText.anchor.set(0.5);
    cacheText.zIndex = 110;
    app.stage.addChild(cacheText);

    state.caches.push({
      x, y,
      sprite: cache,
      text: cacheText,
      resources: {
        solarPrefabs: 5,
        powerLines: 5,
        metalStruts: 5,
        lighting: 5,
        containers: 5,
        tools: 5,
        concrete: 5
      },
      inventoried: false
    });
  }
}

function setupTiles() {
  for (let x = 0; x < config.gridSize; x++) {
    state.grid[x] = [];
    for (let y = 0; y < config.gridSize; y++) {
      state.grid[x][y] = createTile(x, y);
    }
  }

  createCaches();

  state.starship = new PIXI.Graphics();
  state.starship.beginFill(0x808080);
  state.starship.lineStyle(2, 0x000000);
  state.starship.drawRect(-20, -50, 40, 100);
  state.starship.x = window.innerWidth / 2 + config.tileWidth / 2;
  state.starship.y = window.innerHeight / 2 + config.tileHeight / 2;
  state.starship.zIndex = 50;
  app.stage.addChild(state.starship);

  state.starshipText = new PIXI.Text('Starship', { ...tileTextStyle });
  state.starshipText.x = state.starship.x;
  state.starshipText.y = state.starship.y;
  state.starshipText.anchor.set(0.5);
  state.starshipText.zIndex = 60;
  app.stage.addChild(state.starshipText);

  state.surveyTeam = new PIXI.Graphics();
  state.surveyTeam.beginFill(0xFF0000);
  state.surveyTeam.lineStyle(2, 0x000000);
  state.surveyTeam.drawCircle(0, 0, 15);
  state.surveyTeam.x = window.innerWidth / 2 + config.tileWidth / 2;
  state.surveyTeam.y = window.innerHeight / 2 + config.tileHeight / 2;
  state.surveyTeam.state = 'idle';
  state.surveyTeam.startTime = 0;
  state.surveyTeam.zIndex = 200;
  app.stage.addChild(state.surveyTeam);

  state.surveyTeamLabel = new PIXI.Text('Survey Team', { ...teamLabelStyle });
  state.surveyTeamLabel.x = state.surveyTeam.x;
  state.surveyTeamLabel.y = state.surveyTeam.y + 20;
  state.surveyTeamLabel.anchor.set(0.5);
  state.surveyTeamLabel.zIndex = 210;
  app.stage.addChild(state.surveyTeamLabel);

  app.stage.x = 0;
  app.stage.y = 0;
  app.stage.scale.x = 1;
  app.stage.scale.y = 1;
  app.stage.sortableChildren = true;
}

function completeBuild(blueprint) {
  const structure = config.structures[blueprint.structure];
  const tile = state.grid[blueprint.x][blueprint.y];
  tile.type = structure.type;
  tile.color = structure.color;
  tile.sprite.clear();
  tile.sprite.beginFill(structure.color);
  tile.sprite.lineStyle(2, 0x333333);
  tile.sprite.drawPolygon([
    0, config.tileHeight / 2,
    config.tileWidth / 2, 0,
    config.tileWidth, config.tileHeight / 2,
    config.tileWidth / 2, config.tileHeight
  ]);
  tile.text.text = `${structure.text}\n${tile.terrainType}`;
  tile.text.visible = state.showTileText;

  updatePower();
  if (structure.maxPopulation) {
    state.maxPopulation += structure.maxPopulation;
    if (state.population < state.maxPopulation) {
      state.population += 1;
    }
  }

  addMessage(`Completed ${blueprint.structure} on ${tile.terrainType} at (${blueprint.x - 9}, ${blueprint.y - 9})`);
  app.stage.removeChild(blueprint.loadingBar);
  blueprint.loadingBar.destroy();
}

// End of file