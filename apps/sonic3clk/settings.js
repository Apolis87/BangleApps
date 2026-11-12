(function (back) {
  const settings = require("Storage").readJSON("sonic3clk.settings.json", 1) ||
    require("Storage").readJSON("sonic3clk-settings", 1) || {
      activeMode: false,
      twistThreshold: 1600,
    };

  function save() {
    require("Storage").writeJSON("sonic3clk.settings.json", settings);
    Bangle.setOptions({
      twistThreshold: settings.twistThreshold,
      wakeOnTwist: !settings.activeMode,
    });
  }

  const menu = {
    "": { title: "Sonic 3 Clock" },
    "< Back": back,
    "Active Mode": {
      value: !!settings.activeMode,
      onchange: (v) => {
        settings.activeMode = v;
        save();
      },
    },
    "Twist Thresh": {
      value: settings.twistThreshold || 1600,
      min: 800,
      max: 4000,
      step: 200,
      onchange: (v) => {
        settings.twistThreshold = v;
        save();
      },
    },
  };

  E.showMenu(menu);
})
