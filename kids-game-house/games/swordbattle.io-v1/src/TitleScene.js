import ImgButton from "./components/PhaserImgButton";
import Phaser from "phaser";

class TitleScene extends Phaser.Scene {
  constructor(playPreroll, callback) {
    super();
    this.playPreroll = false;
    this.callback = callback;
  }

  preload() {
  }

  create() {
    this.sceneStart = Date.now();

    var access = true;
    try {
      window.localStorage;
    } catch (e) {
      access = false;
    }

    if (access) {
      if (window.localStorage.getItem("options")) {
        this.options = JSON.parse(window.localStorage.getItem("options"));
      } else {
        this.options = {
          movementMode: "keys",
          sound: "normal",
          server: "auto",
          country: false,
          antiAliasing: "true"
        };
        window.localStorage.setItem("options", JSON.stringify(this.options));
      }
    } else {
      this.options = {
        movementMode: "keys",
        sound: "normal",
        server: "auto",
        country: false,
        antiAliasing: true
      };
    }
    if (!this.options.hasOwnProperty("antiAliasing")) {
      this.options.antiAliasing = true;
    }

    try {
      this.music = this.sound.add("openingsound", {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0
      });
      this.music.play();
    } catch (e) {
      console.log("No opening sound");
    }

    this.background = this.add.image(0, 0, "opening").setOrigin(0).setScrollFactor(0, 0).setScale(2);
    this.footer = this.add.dom(this.canvas.width / 2, this.canvas.height).createFromCache("footer").setOrigin(0.5).setScale(this.mobile ? 1 : 2);
    this.nameBox = this.add.dom(this.canvas.width / 2, 0).createFromCache("title");

    if (access) this.nameBox.getChildByName("name").value = window.localStorage.getItem("oldName") ? window.localStorage.getItem("oldName") : "";
    else this.nameBox.getChildByName("name").value = "";

    this.done = false;
    this.text = this.add.text(this.canvas.width / 2, 0, "Swordbattle.io", {
      fontSize: "64px",
      fill: "#000000"
    }).setOrigin(0.5);

    if (this.options.sound == "normal") {
      this.music.volume = 0.5;
    } else if (this.options.sound == "high") {
      this.music.volume = 1;
    } else if (this.options.sound == "low") {
      this.music.volume = 0.2;
    } else if (this.options.sound == "off") {
      this.music.volume = 0;
    } else {
      this.options.sound = "normal";
      this.music.volume = 0.5;
      if (access) window.localStorage.setItem("options", JSON.stringify(this.options));
    }

    this.settingsBtn = new ImgButton(this, 0, 0, "settingsBtn", () => {
      if (this.settings && this.settings.visible) return this.settings.destroy();
      this.settings = this.add.dom(0, 0).createFromCache("settings");
      this.settings.x = (this.canvas.width / 2);
      this.settings.y = (this.canvas.height / 2);
      this.settings.getChildByName("close").onclick = () => {
        this.settings.destroy();
      };

      try {
        if (document.getElementById("movement")) {
          document.getElementById("movement").value = this.options.movementMode;
          document.getElementById("sound").value = this.options.sound;
          document.getElementById("antiAliasing").checked = this.options.antiAliasing === "true";

          document.getElementById("movement").onchange = () => {
            this.options.movementMode = this.mobile ? "keys" : document.getElementById("movement").value;
            if (access) window.localStorage.setItem("options", JSON.stringify(this.options));
          };
          document.getElementById("sound").onchange = () => {
            this.options.sound = document.getElementById("sound").value;
            if (access) window.localStorage.setItem("options", JSON.stringify(this.options));

            if (this.options.sound == "normal") {
              this.music.volume = 0.6;
            } else if (this.options.sound == "high") {
              this.music.volume = 1.2;
            } else if (this.options.sound == "low") {
              this.music.volume = 0.2;
            } else if (this.options.sound == "off") {
              this.music.volume = 0;
            }
          };
          document.getElementById("antiAliasing").onchange = () => {
            if (!access) alert("Error: unable to save antiAliasing.");
            this.options.antiAliasing = document.getElementById("antiAliasing").checked.toString();
            window.localStorage.setItem("options", JSON.stringify(this.options));
            window.location.reload();
          };
        }
      } catch (e) {
        console.log("Settings element not found, skipping:", e);
      }
    });

    const go = () => {
      let name = this.nameBox.getChildByName("name");
      if (!name) return;
      else if (name.value == "") return;
      else if (this.done) return;
      else {
        this.done = true;
        if (access) window.localStorage.setItem("oldName", name.value);
        var myName = name.value;
        this.nameBox.destroy();
        this.callback(myName, this.music, this.secret);
      }
    };

    var go2 = () => {
      if (this.settings && this.settings.visible) {
        this.settings.destroy();
      } else if (this.nameBox.getChildByName("btn").disabled) {
      } else go();
    };
    this.nameBox.getChildByName("btn").onclick = () => {
      go2();
    };
    this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER, false);
    this.returnKey.on("down", event => {
      go2();
    });

    var clamp = (val, min, max) => {
      if (val < min) return min;
      if (val > max) return max;
      return val;
    };

    const resize = (when = false) => {
      this.game.scale.resize(this.canvas.width, this.canvas.height);

      try {
        const cameraWidth = this.cameras.main.width;
        const cameraHeight = this.cameras.main.height;

        this.background.setScale(Math.max(cameraWidth / this.background.width, cameraHeight / this.background.height));
        this.background.x = 0 - ((this.background.displayWidth - cameraWidth) / 2);
      } catch (e) {
      }
      this.nameBox.x = this.canvas.width / 2;
      this.text.x = this.canvas.width / 2;

      this.settingsBtn.btn.setScale(clamp(this.canvas.width / 10000, 0.08, 0.4));
      this.settingsBtn.btn.y = this.canvas.height - this.settingsBtn.btn.displayHeight;

      if (this.settings && this.settings.visible) {
        this.settings.x = this.canvas.width / 2;
        this.settings.y = this.canvas.height / 2;
      }

      if (this.scene.isActive("title")) {
        try {
          this.footer.destroy();
          this.footer = this.add.dom(this.canvas.width / 2, this.canvas.height).createFromCache("footer").setOrigin(0.5).setScale(this.mobile ? 1 : 2);
        } catch (e) {
        }
      }
      var footery = this.canvas.height - (this.footer.height);
      if (this.canvas.height < 384) footery = this.canvas.height - (this.footer.height / 2);
      if (this.footerdone) this.text.y = this.canvas.height / 4;
      if (this.footerdone) this.footer.y = footery;

      try {
        this.text.setFontSize(this.canvas.width / 13);
      } catch (e) {
      }
      this.footer.x = this.canvas.width / 2;
    };

    var doit;
    window.addEventListener("resize", function () {
      clearTimeout(doit);
      doit = setTimeout(resize, 100);
    });

    resize(true);

    var footery = this.canvas.height - (this.footer.height);
    if (this.canvas.height < 384) footery = this.canvas.height - (this.footer.height / 2);

    this.tweens.add({
      targets: this.footer,
      y: footery,
      onComplete: () => {
        this.footerdone = true;
      },
      duration: 1000,
      ease: "Power2"
    });

    this.tweens.add({
      targets: this.text,
      y: this.canvas.height / 4,
      duration: 1000,
      ease: "Power2"
    });

    if (this.instantStart) {
      go();
    }
  }

  update(d) {
    this.nameBox.y = (this.mobile ? this.text.y + (this.text.height / 2) : this.text.y + (this.text.height));

    var footery = this.canvas.height - (this.footer.height);
    if (this.canvas.height < 384) footery = this.canvas.height - (this.footer.height / 2);

    if (this.footerdone && this.footer.y != footery) this.footer.y = footery;
  }
}

export default TitleScene;
