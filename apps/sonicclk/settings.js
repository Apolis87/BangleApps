(function (back) {
  const FILE = "sonicclk.settings.json";
  const settings = Object.assign(
    {
      activeMode: false,
      twistThreshold: 1600,
      theme: "Classic",
    },
    require("Storage").readJSON(FILE, 1) ||
      require("Storage").readJSON("sonicclk-settings", 1)
  );

  const writeSettings = () => {
    require("Storage").writeJSON(FILE, settings);
  };

  const themes = ["Classic", "Sonic 3"];

  const menu = {
    "": { title: "Sonic Clock" },
    "< Back": () => back(),
    "Theme": {
      value: Math.max(0, themes.indexOf(settings.theme)),
      min: 0,
      max: themes.length - 1,
      format: (v) => themes[v],
      onchange: (v) => {
        settings.theme = themes[v];
        writeSettings();
      },
    },
    "Active Mode": {
      value: !!settings.activeMode,
      onchange: (v) => {
        settings.activeMode = v;
        writeSettings();
      },
    },
    "Twist Thresh": {
      value: settings.twistThreshold,
      min: 800,
      max: 4000,
      step: 200,
      onchange: (v) => {
        settings.twistThreshold = v;
        writeSettings();
      },
    },
  };

  E.showMenu(menu);
})
