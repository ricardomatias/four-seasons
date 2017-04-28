'use strict';

function Sketch(options) {
	options = options || {};

	this._stats = options.stats;
	this._datGui = options.datGui;
	this._colors = options.colors;
}

Sketch.prototype.setup = function(fn) {
	if (fn) {
		this.__setup = fn.bind(this);
	} else {

		if (!this.__setup) {
			throw new Error('need to define a "setup" function');
		}

		this._bootstrap();
	}
};

Sketch.prototype.draw = function(fn) {
	if (fn) {
		this.__draw = fn.bind(this);
	} else {

		if (!this.__draw) {
			throw new Error('need to define a "draw" function');
		}

		if (this._stats) {
			this._stats.begin();
		}

		this.__draw();

		if (this._stats) {
			this._stats.end();
		}
	}
};

/* eslint "no-console": 0 */
Sketch.prototype._bootstrap = function() {
	console.log('%cBOOTSTRAPING', 'background-color: black; color: white;');

	if (this._stats) {
		this.setupStats();
	}

	if (this._datGui) {
		this.setupDatGui();
	}

	console.log('%cCALLING SETUP', 'background-color: black; color: white;');

	this.__setup();
};

Sketch.prototype.registerShortcuts = function(shortcuts) {
	var self = this;

  shortcuts.forEach(function(shortcut) {
    var key = shortcut.key;

    if (key.length === 1) {
      key = 'Key' + key.toUpperCase();
    }

    document.addEventListener('keyup', function(event) {
      if (key === event.code) {
        shortcut.action.call(self);
      }

      event.stopPropagation();
      event.preventDefault();
    });
  });
};

Sketch.prototype.setupStats = function() {
	// SETUP STATS
	if (!Stats) {
		throw new Error('cannot find dependency: Stats');
	}

	this._stats = new Stats();

	this._stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

	document.body.appendChild(this._stats.dom);
};

Sketch.prototype.setNewColorScheme = function() {
	if (!this._paletteIndex) {
		this._paletteIndex = 0;
	}

	this.backgroundColor = this._colors[this._paletteIndex][0];
	this.fillColor = this._colors[this._paletteIndex][1];

	this._paletteIndex++;

	if (this._paletteIndex > this._colors.length - 1) {
		this._paletteIndex = 0;
	}
};

Sketch.prototype.toRGB = function(hex, alpha) {
	var clr = [ hex[1] + hex[2], hex[3] + hex[4], hex[5] + hex[6] ];

	return color.apply(p5, unhex(clr).concat(alpha));
};

Sketch.prototype.takeScreenshot = function(preset) {
  var screenshot = canvas.toDataURL('image/png').replace(/^data:image\/[^;]/, 'data:application/octet-stream');

  var element = document.createElement('a');

  element.setAttribute('href', screenshot);
  element.setAttribute('download', 'screenshot-' + preset + '-' + Helpers.genUID() + '.png');
  element.setAttribute('target', '_blank');

  element.style.display = 'none';

  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};
