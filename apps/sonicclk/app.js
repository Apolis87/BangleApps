const vw = g.getWidth();
const bgWidth = 384;

// Settings
const savedSettings =
  require("Storage").readJSON("sonicclk.settings.json", 1) ||
  require("Storage").readJSON("sonicclk-settings", 1) ||
  {};
const settings = {
  activeMode: savedSettings.activeMode === true,
  twistThreshold:
    typeof savedSettings.twistThreshold === "number"
      ? savedSettings.twistThreshold
      : 1600,
  theme:
    savedSettings.theme === "Sonic 2" || savedSettings.theme === "Sonic 3"
      ? savedSettings.theme
      : "Sonic 8-bit",
};
let isSettings = false;

function loadTheme(name) {
  let file = "sonicclk.theme0.js";
  if (name === "Sonic 2") file = "sonicclk.theme2.js";
  else if (name === "Sonic 3") file = "sonicclk.theme1.js";

  let content = require("Storage").read(file);
  if (!content && file !== "sonicclk.theme0.js") {
    content = require("Storage").read("sonicclk.theme0.js");
  }
  if (!content) {
    throw new Error("Theme file not found: " + file);
  }
  return eval(content);
}

let theme = loadTheme(settings.theme);

const sonic = {
  bpp: 4,
  transparent: 1,
  palette: theme.sonicPalette,
};

const topSpeed = 15;
const timeout = 150;
let currentSpeed = 0;
let currentSonic = -1;

let drawInterval;
let drawTimeout;
let waitTimeout;

const bgScroll = [0, null];

const start = () => {
  if (drawTimeout) clearTimeout(drawTimeout);
  if (drawInterval) clearInterval(drawInterval);

  drawInterval = setInterval(() => {
    draw("start");
    bgScroll[0] += currentSpeed;
    if (bgScroll[1]) bgScroll[1] += currentSpeed;

    if (currentSpeed < topSpeed) {
      currentSpeed++;
    }
  }, timeout);
};

const stop = () => {
  if (drawTimeout) clearTimeout(drawTimeout);
  if (drawInterval) clearInterval(drawInterval);

  drawInterval = setInterval(() => {
    if (currentSpeed <= 0) {
      clearInterval(drawInterval);
      draw("reset");
    } else {
      draw("stop");
      bgScroll[0] += currentSpeed;
      if (bgScroll[1]) bgScroll[1] += currentSpeed;
      currentSpeed--;
    }
  }, timeout);
};

const wait = () => {
  currentSonic = -1;
  currentSpeed = 0;
  if (drawTimeout) clearTimeout(drawTimeout);
  if (drawInterval) clearInterval(drawInterval);

  drawInterval = setInterval(() => draw("wait"), timeout);

  waitTimeout = setTimeout(() => {
    clearInterval(drawInterval);
    currentSonic = -1;
    draw("reset");
  }, 7500);
};

const queueDraw = () => {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function () {
    drawTimeout = undefined;
    draw("reset");
  }, 60000 - (Date.now() % 60000));
};

const drawSonic = (action) => {
  let target;

  if (action === "reset" || currentSonic === -1) {
    target = theme.defaultSonic;
  } else if (action === "start") {
    target = theme.startingBuffers[currentSonic];
  } else if (action === "stop") {
    if (currentSonic > 1) currentSonic = 0;
    target = theme.stoppingBuffers[currentSonic];
  } else {
    const seq = theme.waitingSequence;
    target = seq
      ? theme.waitingBuffers[seq[currentSonic]]
      : theme.waitingBuffers[currentSonic];
  }

  sonic.width = target.width;
  sonic.height = target.height;
  sonic.buffer = target.buffer;
  sonic.offset = target.offset;

  g.drawImage(
    sonic,
    vw / 2 - 30 + (50 - sonic.width) + (sonic.offset || 0),
    86 + (65 - sonic.height)
  );

  if (action === "start") {
    if (currentSonic === theme.startingBuffers.length - 1) {
      currentSonic = 6;
    } else {
      currentSonic++;
    }
  } else if (action === "stop") {
    if (currentSpeed <= 2) {
      currentSonic = -1;
    } else if (currentSpeed <= 14) {
      currentSonic = 1;
    } else {
      currentSonic = 0;
    }
  } else {
    const seq = theme.waitingSequence;
    if (seq) {
      if (currentSonic === seq.length - 1) {
        currentSonic =
          theme.waitingLoopStart !== undefined ? theme.waitingLoopStart : 0;
      } else {
        currentSonic++;
      }
    } else {
      if (currentSonic === theme.waitingBuffers.length - 1) {
        currentSonic = 0;
      } else {
        currentSonic++;
      }
    }
  }
};

let lastTimeStr = "";
let lastDateStr = "";
let lastTimeMin = -1;

const drawTime = () => {
  const x = vw / 2;
  const y = 52;

  const now = Date.now();
  const currentMin = Math.floor(now / 60000);
  if (currentMin !== lastTimeMin) {
    lastTimeMin = currentMin;
    const date = new Date(now);
    lastTimeStr = require("locale").time(date, 1).trim();
    lastDateStr = require("locale").date(date).toUpperCase();
  }

  g.setColor("#000");
  g.setFontAlign(0, 0).setFont("6x8", 5);
  g.drawString(lastTimeStr, x + 3, y + 2);

  g.setFont("6x8", 1.5);
  g.drawString(lastDateStr, x + 1, y + 29);

  g.setColor("#fff");
  g.setFontAlign(0, 0).setFont("6x8", 5);
  g.drawString(lastTimeStr, x, y);

  g.setFont("6x8", 1.5);
  g.drawString(lastDateStr, x, y + 28);
};

const draw = (action) => {
  if (action === "wait") {
    g.setClipRect(44, 86, 116, 153);
    g.drawImage(theme.bg, -bgScroll[0], 24);
    if (bgScroll[1]) g.drawImage(theme.bg, -bgScroll[1], 24);
    drawSonic(action);
    g.setClipRect(0, 0, vw - 1, g.getHeight() - 1);
    return;
  }

  if (bgWidth - bgScroll[0] < 0) {
    bgScroll[0] = bgScroll[1];
    bgScroll[1] = null;
  }

  g.drawImage(theme.bg, -bgScroll[0], 24);

  if (bgWidth - bgScroll[0] < vw) {
    bgScroll[1] = bgScroll[0] - bgWidth;
    g.drawImage(theme.bg, -bgScroll[1], 24);
  }

  drawSonic(action);
  drawTime();
  if (action === "reset") queueDraw();
};

const fullReset = () => {
  if (drawTimeout) clearTimeout(drawTimeout);
  if (drawInterval) clearInterval(drawInterval);
  if (waitTimeout) clearTimeout(waitTimeout);
  currentSpeed = 0;
  currentSonic = -1;
  bgScroll[0] = 0;
  bgScroll[1] = null;
};

const applyTheme = (themeName) => {
  theme = loadTheme(themeName);
  sonic.palette = theme.sonicPalette;
  g.setTheme({ bg: theme.themeBg, fg: "#fff", dark: true }).clear();
  Bangle.drawWidgets();
  draw("reset");
};

const themes = ["Sonic 8-bit", "Sonic 2", "Sonic 3"];

const settingsMenu = {
  "": { title: "Settings" },
  "Theme": {
    value: Math.max(0, themes.indexOf(settings.theme)),
    min: 0,
    max: themes.length - 1,
    format: (v) => themes[v],
    onchange: (v) => {
      settings.theme = themes[v];
      require("Storage").writeJSON("sonicclk.settings.json", settings);
      applyTheme(settings.theme);
    },
  },
  "Active Mode": {
    value: !!settings.activeMode,
    format: (v) => (v ? "On" : "Off"),
    onchange: (v) => (settings.activeMode = v),
  },
  "Twist Thresh": {
    value: settings.twistThreshold,
    min: 800,
    max: 4000,
    step: 200,
    onchange: (v) => (settings.twistThreshold = v),
  },
  Exit: () => {
    isSettings = false;

    require("Storage").writeJSON("sonicclk.settings.json", settings);
    Bangle.setOptions({
      lockTimeout: 10000,
      backlightTimeout: 12000,
      twistThreshold: settings.twistThreshold,
      wakeOnTwist: !settings.activeMode,
    });

    E.showMenu();
    Bangle.setUI("clock");
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    draw("reset");
    start();
  },
};

g.setTheme({ bg: theme.themeBg, fg: "#fff", dark: true }).clear();

Bangle.on("lock", (locked) => {
  if (!isSettings) {
    if (locked) {
      stop();
    } else {
      start();
    }
  }
});

Bangle.on("twist", () => {
  if (isSettings) return;
  if (settings.activeMode) {
    fullReset();
    draw("reset");
  } else {
    wait();
  }
});

Bangle.on("tap", (d) => {
  if (!isSettings && !Bangle.isLocked() && d.double && d.dir === "top") {
    fullReset();
    isSettings = true;
    E.showMenu(settingsMenu);
  }
});

Bangle.setOptions({
  lockTimeout: 10000,
  backlightTimeout: 12000,
  twistThreshold: settings.twistThreshold,
  wakeOnTwist: !settings.activeMode,
});

Bangle.setUI("clock");

Bangle.loadWidgets();
Bangle.drawWidgets();

draw("reset");

if (Bangle.isLocked()) {
  stop();
} else {
  start();
}
