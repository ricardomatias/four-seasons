'use strict';

function EventBus() {
  this._handlers = {};
}

EventBus.prototype.on = function(event, fn, that) {
  if (that) {
    fn = fn.bind(that);
  }

  if (!this._handlers[event]) {
    this._handlers[event] = [];
  }

  this._handlers[event].push(fn);
};

EventBus.prototype.off = function(event, fn) {
  var handlers = this._handlers[event],
      idx;

  if (!handlers) {
    return;
  }

  for (idx = 0; idx < handlers.length; idx++) {
    if (handlers[idx] === fn) {
      handlers.splice(idx, 1);

      break;
    }
  }
};

EventBus.prototype.fire = function(event, payload) {
  var handlers = this._handlers[event],
      idx;

  if (!handlers) {
    return;
  }

  for (idx = 0; idx < handlers.length; idx++) {
    handlers[idx](payload);
  }
};

EventBus.prototype.emit = function() {
  throw new Error('please use "fire" instead');
};
