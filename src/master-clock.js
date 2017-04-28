'use strict';

var NUM_STEPS = 4,
    JITTER_TIME = 5;

/**
 * need to map the peak with the most commong interval to a variable
 * need to build a SYNC system
 */
function MasterClock(eventBus, audioContext) {
  this._eventBus = eventBus;
  this._audioContext = audioContext;

  this._isPlaying = false;

  this._activeTick = 0;

  this._nextNoteTime = 0.0;
  this._currentNote = 0.0;
  this._scheduleAheadTime = 0.2; // seconds
}

MasterClock.prototype.start = function(tempo) {
  var self = this,
      eventBus = this._eventBus,
      clock;

  this._tempo = tempo;

  if (this.clock) {
    this.clock.terminate();
  }

  clock = this.clock = new Worker('./src/clock-worker.js');

  clock.onmessage = function(e) {
    // run scheduler
    if (e.data) {
      self.scheduler(e.data);
    }
  };

  clock.postMessage({ action: 'start' });

  eventBus.fire('master-clock.start', { numSteps: NUM_STEPS });

  this.isRunning = true;
};

MasterClock.prototype.stop = function() {
  var clock = this.clock;

  if (clock) {
    clock.postMessage({ action: 'stop' });

    clock.terminate();
  }

  this.isRunning = false;
};

MasterClock.prototype.sync = function(interval) {
  var clock = this.clock;

  if (!clock) {
    return;
  }

  // calculate the delta time
  clock.postMessage({ action: 'sync', interval: (interval / NUM_STEPS) - JITTER_TIME });
};

MasterClock.prototype.setNewTempo = function(tempo) {
  this._tempo = tempo;
};

MasterClock.prototype.scheduler = function(time) {
  var audioContext = this._audioContext,
      eventBus = this._eventBus;

  // look ahead
  while (this._nextNoteTime < audioContext.currentTime + this._scheduleAheadTime ) {
    // schedule notes if any are registered for the current quarter note
    eventBus.fire('master-clock.tick', {
      tick: this._currentNote,
      nextNoteTime: this._nextNoteTime,
      time: time
    });

    this.nextNote();
  }
};

MasterClock.prototype.nextNote = function() {
  var secondsPerBeat = 60.0 / this._tempo; // change tempo to change tempo

  this._nextNoteTime += secondsPerBeat / 4;

  this._currentNote++;

  if (this._currentNote === NUM_STEPS) {
    this._currentNote = 0;
  }
};
