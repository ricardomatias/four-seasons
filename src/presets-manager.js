'use strict';

function PresetsManager() {
  this._active = null;
  this._defaults = {};
  this._presets = [];
  this._setups = {};
}

PresetsManager.prototype._runSetup = function() {
  var preset = this._active,
      defaults = this._defaults[preset];

  if (this._setups[preset]) {
    this._setups[preset](defaults);
  }
};

PresetsManager.prototype.getActiveName = function() {
  return this._active;
};

PresetsManager.prototype.register = function(name, defaults) {
  this._presets.push(name);

  this._defaults[name] = defaults;
};

PresetsManager.prototype.registerMultiple = function(presets) {
  presets.forEach(function(preset) {
    this._presets.push(preset);
  }, this);
};

PresetsManager.prototype.selectNext = function() {
  var presets = this._presets;

  var curr = presets.indexOf(this._active),
      index = curr + 1;

  if (index > presets.length - 1) {
    index = 0;
  }

  this.select(presets[index]);

  this._runSetup();
};

PresetsManager.prototype.selectPrevious = function() {
  var presets = this._presets;

  var curr = presets.indexOf(this._active),
      index = curr - 1;

  if (index < 0) {
    index = presets.length - 1;
  }

  this.select(presets[index]);

  this._runSetup();
};

PresetsManager.prototype.selectRandom = function() {
  var presets = this._presets;

  var randInt = Math.floor(Math.random() * this._presets.length);

  this.select(presets[randInt]);

  this._runSetup();
};

PresetsManager.prototype.select = function(name) {
  this._active = name;

  this._runSetup();

  /* eslint "no-console": 0 */
  console.log('%cPRESET: ' + name, 'background-color: black; color: white;');
};

PresetsManager.prototype.setup = function(presets, fn, that) {
  if (!Array.isArray(presets)) {
    presets = [ presets ];
  }

  presets.forEach(function(preset) {
    if (that) {
      fn = fn.bind(that);
    }

    this._setups[preset] = fn;
  }, this);
};

/**
 * Two ways of running:
 * - specific presets -> different implementation
 * - preset-agnostic -> same implementation, different values
 */
PresetsManager.prototype.draw = function(name, fn, that) {
  var presets;

  if (Array.isArray(name)) {
    presets = name;
    name = this._active;

    if (presets.indexOf(name) !== -1) {

      if (that) {
        fn = fn.bind(that);
      }

      return fn(this._defaults[name]);
    }
  } else if (name === this._active) {

    if (that) {
      fn = fn.bind(that);
    }

    return fn(this._defaults[name]);
  }

  if (typeof name === 'function' && this._active) {
    fn = name;

    if (that) {
      fn = fn.bind(that);
    }

    return fn(this._defaults[this._active]);
  }
};
