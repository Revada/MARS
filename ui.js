const textStyle = { fontFamily: 'Orbitron, Arial', fontSize: 18, fontWeight: '400', fill: 0xFFFFFF, align: 'left', stroke: '#000000', strokeThickness: 4 };
const menuTextStyle = { fontFamily: 'Orbitron, Arial', fontSize: 17, fontWeight: '400', fill: 0xFFFFFF, align: 'left' };
const tileTextStyle = { fontFamily: 'Orbitron, Arial', fontSize: 12, fontWeight: '400', fill: 0xFFFFFF, align: 'center', stroke: '#000000', strokeThickness: 2 };
const analysisTextStyle = { fontFamily: 'Orbitron, Arial', fontSize: 14, fontWeight: '400', fill: 0xFFFFFF, align: 'left', stroke: '#000000', strokeThickness: 2, wordWrap: true, wordWrapWidth: 200 };
const teamLabelStyle = { fontFamily: 'Orbitron, Arial', fontSize: 12, fontWeight: '400', fill: 0xFFFFFF, align: 'center', stroke: '#000000', strokeThickness: 2 };

const contextOptions = ['Build', 'Analyse', 'Close'];
const contextMenuHeight = contextOptions.length * 20 + 20;
const buildMenuHeight = state.menuOptions.length * 20 + 20;
const topBarMenuHeight = 40;

function setupUI() {
  state.uiContainer = new PIXI.Container();
  state.uiContainer.zIndex = 1000;
  app.stage.addChild(state.uiContainer);

  state.statusText = new PIXI.Text('Day: 1 Hour: 10am\nPower: 0\nColonists: 25\nSurvey Teams: 1\nBuild Teams: 0\nLogistics Teams: 0\nOn Mission: 5\nWeather: Clear\nBuggies: 2', { ...textStyle, align: 'left' });
  state.statusText.x = 20;
  state.statusText.y = 70;
  state.uiContainer.addChild(state.statusText);

  state.positionText = new PIXI.Text('Survey Team: (0, 0)\nMaterials:\n  Solar Prefabs: 20\n  Power Lines: 15\n  Metal Struts: 10\n  Lighting: 10\n  Containers: 10\n  Tools: 10\n  Concrete: 10\n  Regolith: 0', { ...textStyle, align: 'right' });
  state.positionText.x = window.innerWidth - 20;
  state.positionText.y = 70;
  state.positionText.anchor.set(1, 0);
  state.uiContainer.addChild(state.positionText);

  state.topBar = new PIXI.Graphics();
  state.topBar.beginFill(0x333333, 1.0);
  state.topBar.drawRect(0, 0, window.innerWidth, 50);
  state.topBar.zIndex = 1100;
  state.uiContainer.addChild(state.topBar);

  state.topBarMenuButton = new PIXI.Graphics();
  state.topBarMenuButton.beginFill(0x333333, 1.0);
  state.topBarMenuButton.drawRect(10, 10, 100, 30);
  state.topBarMenuButton.interactive = true;
  state.topBarMenuButton.buttonMode = true;
  state.topBarMenuButton.zIndex = 1100;
  state.uiContainer.addChild(state.topBarMenuButton);

  const menuButtonText = new PIXI.Text('Menu', { ...menuTextStyle });
  menuButtonText.x = state.topBarMenuButton.x + 10;
  menuButtonText.y = state.topBarMenuButton.y + 5;
  menuButtonText.zIndex = 1100;
  state.uiContainer.addChild(menuButtonText);

  state.topBarTitle = new PIXI.Text('MARS Colony', { ...textStyle, align: 'center' });
  state.topBarTitle.x = window.innerWidth / 2;
  state.topBarTitle.y = 15;
  state.topBarTitle.anchor.set(0.5, 0);
  state.topBarTitle.zIndex = 1100;
  state.uiContainer.addChild(state.topBarTitle);

  state.messageLogText = new PIXI.Text('', { ...teamLabelStyle, align: 'left', wordWrap: true, wordWrapWidth: 300 });
  state.messageLogText.x = 20;
  state.messageLogText.y = window.innerHeight - 20;
  state.messageLogText.anchor.set(0, 1);
  state.messageLogText.interactive = true;
  state.messageLogText.zIndex = 900;
  state.uiContainer.addChild(state.messageLogText);

  let isHovering = false;
  state.messageLogText.on('mouseover', () => {
    isHovering = true;
    updateMessageLog();
  });
  state.messageLogText.on('mouseout', () => {
    isHovering = false;
    updateMessageLog();
  });
  state.messageLogText.on('wheel', (e) => {
    if (isHovering) {
      state.messageLogScroll += e.deltaY > 0 ? 1 : -1;
      state.messageLogScroll = Math.max(0, Math.min(state.messageLogScroll, state.messages.length - 1));
      updateMessageLog();
    }
  });

  state.topBarMenuButton.on('click', (e) => {
    e.stopPropagation();
    if (state.topBarMenu) {
      closeTopBarMenu();
    } else {
      openTopBarMenu();
    }
  });
}

function updateUI() {
  const onMission = 5 + state.buildTeams.length * 5 + state.logisticsTeams.length * 2;
  state.statusText.text = `Day: ${state.day} Hour: ${formatHour(state.hour)}\nPower: ${state.power}\nColonists: ${state.population}\nSurvey Teams: 1\nBuild Teams: ${state.buildTeams.length}\nLogistics Teams: ${state.logisticsTeams.length}\nOn Mission: ${onMission}\nWeather: ${state.dustStorm ? 'Dust Storm' : 'Clear'}\nBuggies: ${state.buggies}`;
  const { x: gridX, y: gridY } = getGridPosition(state.surveyTeam.x, state.surveyTeam.y);
  state.positionText.text = `Survey Team: (${gridX - 9}, ${gridY - 9})\nMaterials:\n  Solar Prefabs: ${state.materials.solarPrefabs}\n  Power Lines: ${state.materials.powerLines}\n  Metal Struts: ${state.materials.metalStruts}\n  Lighting: ${state.materials.lighting}\n  Containers: ${state.materials.containers}\n  Tools: ${state.materials.tools}\n  Concrete: ${state.materials.concrete}\n  Regolith: ${state.materials.regolith}`;
  state.positionText.x = window.innerWidth - 20;
}

function updateMessageLog() {
  const currentTime = app.ticker.lastTime / 1000;
  if (isHovering) {
    const visibleMessages = state.messages.slice().reverse().slice(state.messageLogScroll, state.messageLogScroll + 5);
    state.messageLogText.text = visibleMessages.map(m => m.text).join('\n');
  } else {
    const recentMessage = state.messages[state.messages.length - 1];
    if (recentMessage && currentTime - recentMessage.timestamp < config.messageDisplayTime) {
      state.messageLogText.text = recentMessage.text;
    } else {
      state.messageLogText.text = '';
    }
  }
}

function addMessage(text) {
  state.messages.push({ text, timestamp: app.ticker.lastTime / 1000 });
  updateMessageLog();
}

function formatHour(hour) {
  if (hour === 0) return '0am';
  if (hour === 12) return '0pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function toggleTileText() {
  state.showTileText = !state.showTileText;
  for (let x = 0; x < config.gridSize; x++) {
    for (let y = 0; y < config.gridSize; y++) {
      state.grid[x][y].text.visible = state.showTileText;
    }
  }
  addMessage(`Tile text display ${state.showTileText ? 'enabled' : 'disabled'}`);
  closeTopBarMenu();
}

function openTopBarMenu() {
  closeTopBarMenu();
  state.menuVisible = true;
  state.topBarMenu = new PIXI.Graphics();
  state.topBarMenu.beginFill(0x333333, 1.0);
  state.topBarMenu.drawRect(10, 40, 100, topBarMenuHeight);
  state.topBarMenu.zIndex = 1100;
  state.uiContainer.addChild(state.topBarMenu);

  const toggleText = new PIXI.Text(`Tile Text: ${state.showTileText ? 'On' : 'Off'}`, { ...menuTextStyle });
  toggleText.x = state.topBarMenu.x + 10;
  toggleText.y = state.topBarMenu.y + 10;
  toggleText.interactive = true;
  toggleText.buttonMode = true;
  toggleText.zIndex = 1100;
  toggleText.on('click', (e) => {
    e.stopPropagation();
    toggleTileText();
  });
  state.uiContainer.addChild(toggleText);
  state.topBarMenuItems.push(toggleText);

  app.stage.off('click', handleOutsideClick);
  app.stage.on('click', handleOutsideClick);
}

function closeTopBarMenu() {
  if (state.topBarMenu) {
    state.menuVisible = false;
    state.topBarMenuItems.forEach(item => {
      state.uiContainer.removeChild(item);
      item.destroy();
    });
    state.uiContainer.removeChild(state.topBarMenu);
    state.topBarMenu.destroy();
    state.topBarMenu = null;
    state.topBarMenuItems = [];
    app.stage.off('click', handleOutsideClick);
  }
}

function openContextMenu(event, relativeX, relativeY) {
  closeContextMenu();
  closeBuildMenu();
  closeAnalysisWindow();
  closeTopBarMenu();

  state.menuVisible = true;
  state.contextMenu = new PIXI.Graphics();
  state.contextMenu.beginFill(0x333333, 1.0);
  state.contextMenu.drawRect(0, 0, 100, contextMenuHeight);
  const tile = state.grid[relativeX + 9][relativeY + 9];
  const menuX = (tile.sprite.x + config.tileWidth / 2 + 10) / app.stage.scale.x - app.stage.x / app.stage.scale.x;
  const menuY = (tile.sprite.y - 20) / app.stage.scale.y - app.stage.y / app.stage.scale.y;
  state.contextMenu.x = Math.max(0, Math.min(menuX, window.innerWidth / app.stage.scale.x - 100));
  state.contextMenu.y = Math.max(0, Math.min(menuY, window.innerHeight / app.stage.scale.y - contextMenuHeight));
  state.contextMenu.zIndex = 900;
  state.uiContainer.addChild(state.contextMenu);

  state.contextMenuItems = contextOptions.map((option, index) => {
    const itemText = new PIXI.Text(option, { ...menuTextStyle });
    itemText.x = state.contextMenu.x + 10;
    itemText.y = state.contextMenu.y + 10 + index * 20;
    itemText.anchor.set(0, 0);
    itemText.interactive = true;
    itemText.buttonMode = true;
    itemText.zIndex = 900;
    itemText.on('click', (e) => {
      e.stopPropagation();
      if (option === 'Build') {
        closeContextMenu();
        openBuildMenu((tile.sprite.x + config.tileWidth / 2 + 10) / app.stage.scale.x - app.stage.x / app.stage.scale.x, (tile.sprite.y - 20) / app.stage.scale.y - app.stage.y / app.stage.scale.y, relativeX, relativeY);
      } else if (option === 'Analyse') {
        closeContextMenu();
        const { description, height } = getTileDescription(tile);
        state.analysisWindow = new PIXI.Graphics();
        state.analysisWindow.beginFill(0x333333, 1.0);
        state.analysisWindow.drawRect(0, 0, 220, height);
        const analysisX = (tile.sprite.x + config.tileWidth / 2 + 10) / app.stage.scale.x - app.stage.x / app.stage.scale.x;
        const analysisY = (tile.sprite.y + config.tileHeight / 2 + 20) / app.stage.scale.y - app.stage.y / app.stage.scale.y;
        state.analysisWindow.x = Math.max(0, Math.min(analysisX, window.innerWidth / app.stage.scale.x - 220));
        state.analysisWindow.y = Math.max(0, Math.min(analysisY, window.innerHeight / app.stage.scale.y - height));
        state.analysisWindow.height = height;
        state.analysisWindow.zIndex = 900;
        state.uiContainer.addChild(state.analysisWindow);

        state.analysisText = new PIXI.Text(description, { ...analysisTextStyle });
        state.analysisText.x = state.analysisWindow.x + 10;
        state.analysisText.y = state.analysisWindow.y + 10;
        state.analysisText.zIndex = 900;
        state.uiContainer.addChild(state.analysisText);
      } else if (option === 'Close') {
        closeContextMenu();
      }
    });
    state.uiContainer.addChild(itemText);
    return itemText;
  });

  app.stage.off('click', handleOutsideClick);
  app.stage.on('click', handleOutsideClick);
}

function closeContextMenu() {
  if (state.contextMenu) {
    state.menuVisible = false;
    state.contextMenuItems.forEach(item => {
      state.uiContainer.removeChild(item);
      item.destroy();
    });
    state.uiContainer.removeChild(state.contextMenu);
    state.contextMenu.destroy();
    state.contextMenu = null;
    state.contextMenuItems = [];
    closeAnalysisWindow();
    app.stage.off('click', handleOutsideClick);
  }
}

function openBuildMenu(x, y, relativeX, relativeY) {
  closeAnalysisWindow();
  state.menuVisible = true;
  state.buildMenu = new PIXI.Graphics();
  state.buildMenu.beginFill(0x333333, 1.0);
  state.buildMenu.drawRect(0, 0, 200, buildMenuHeight);
  state.buildMenu.x = Math.max(0, Math.min(x, window.innerWidth / app.stage.scale.x - 200));
  state.buildMenu.y = Math.max(0, Math.min(y, window.innerHeight / app.stage.scale.y - buildMenuHeight));
  state.buildMenu.zIndex = 900;
  state.uiContainer.addChild(state.buildMenu);

  state.bottomMenuItems = state.menuOptions.map((option, index) => {
    const itemText = new PIXI.Text(option, { ...menuTextStyle });
    itemText.x = state.buildMenu.x + 10;
    itemText.y = state.buildMenu.y + 10 + index * 20;
    itemText.anchor.set(0, 0);
    itemText.interactive = true;
    itemText.buttonMode = true;
    itemText.zIndex = 900;
    itemText.on('click', (e) => {
      e.stopPropagation();
      placeBlueprint(option, relativeX, relativeY);
      closeBuildMenu();
    });
    state.uiContainer.addChild(itemText);
    return itemText;
  });
}

function closeBuildMenu() {
  if (state.buildMenu) {
    state.menuVisible = false;
    state.bottomMenuItems.forEach(item => {
      state.uiContainer.removeChild(item);
      item.destroy();
    });
    state.uiContainer.removeChild(state.buildMenu);
    state.buildMenu.destroy();
    state.buildMenu = null;
    state.bottomMenuItems = [];
  }
}

function openBottomMenu() {
  closeContextMenu();
  closeBuildMenu();
  closeAnalysisWindow();
  closeTopBarMenu();

  state.menuVisible = true;
  state.bottomMenu = new PIXI.Graphics();
  state.bottomMenu.beginFill(0x333333, 1.0);
  state.bottomMenu.drawRect(0, window.innerHeight / app.stage.scale.y - 100, window.innerWidth / app.stage.scale.x, 100);
  state.bottomMenu.zIndex = 900;
  state.uiContainer.addChild(state.bottomMenu);

  state.bottomMenuItems = state.menuOptions.map((option, index) => {
    const itemText = new PIXI.Text(option, { ...menuTextStyle });
    itemText.x = 20 + index * 120;
    itemText.y = state.bottomMenu.y + 20;
    itemText.anchor.set(0, 0);
    itemText.interactive = true;
    itemText.buttonMode = true;
    itemText.zIndex = 900;
    itemText.on('click', (e) => {
      e.stopPropagation();
      placeBuilding(option);
      closeBottomMenu();
    });
    state.uiContainer.addChild(itemText);
    return itemText;
  });
}

function closeBottomMenu() {
  if (state.bottomMenu) {
    state.menuVisible = false;
    state.bottomMenuItems.forEach(item => {
      state.uiContainer.removeChild(item);
      item.destroy();
    });
    state.uiContainer.removeChild(state.bottomMenu);
    state.bottomMenu.destroy();
    state.bottomMenu = null;
    state.bottomMenuItems = [];
  }
}

function closeAnalysisWindow() {
  if (state.analysisWindow) {
    state.uiContainer.removeChild(state.analysisWindow);
    state.analysisWindow.destroy();
    state.analysisWindow = null;
  }
  if (state.analysisText) {
    state.uiContainer.removeChild(state.analysisText);
    state.analysisText.destroy();
    state.analysisText = null;
  }
}

function handleOutsideClick(e) {
  const clickPoint = { x: e.data.global.x, y: e.data.global.y };
  if (state.menuVisible) {
    if (state.contextMenu && !state.contextMenu.containsPoint(clickPoint)) {
      closeContextMenu();
    } else if (state.buildMenu && !state.buildMenu.containsPoint(clickPoint)) {
      closeBuildMenu();
    } else if (state.topBarMenu && !state.topBarMenu.containsPoint(clickPoint) && !state.topBarMenuButton.containsPoint(clickPoint)) {
      closeTopBarMenu();
    }
  }
  if (state.analysisWindow && !state.analysisWindow.containsPoint(clickPoint)) {
    closeAnalysisWindow();
  }
}

// End of file