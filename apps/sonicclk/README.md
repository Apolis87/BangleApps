# Sonic Clock

A Sonic the Hedgehog clock face for Bangle.js 2 featuring run, stop, and wait animations, with selectable **Classic (8-bit)** and **Sonic 3 (16-bit)** themes.

![Sonic Clock screenshot](screenshot.png)

## Usage

- Sonic will run when the screen is unlocked
- Sonic will stop when the screen is locked
- Sonic will wait when looking at your watch face (when `Bangle.on("twist", fn)` is fired). This option is configurable (see below).

## Configuration

To access the settings menu, you can **double tap** on the **top** side of the watch touchscreen while unlocked, or navigate to **Settings -> App Settings -> Sonic Clock**. The following options are configurable:

- `Theme` - choose between **Classic** (original 8-bit Sonic with Green Hill Zone scenery) and **Sonic 3** (16-bit Sonic with Angel Island Zone scenery).
- `Active Mode` - catering for 'active' behaviour where the `twist` method can be fired undesirably. When `on` this will prevent the LCD from turning on when a `twist` event is fired.
- `Twist Thresh` - customise the acceleration needed to activate the twist method (see the [`Bangle.setOptions`](https://www.espruino.com/Reference#:~:text=twisted%3F%20default%20%3D%20true-,twistThreshold,-How%20much%20acceleration) method for more info).

### Credits

- Original app created with love by [Joseph](https://github.com/Johoseph) 🤗
- Sonic 3 theme, App Settings integration, and touch stability improvements by [Apolis87](https://github.com/Apolis87)
- Character and game artwork © SEGA / Sonic Team
