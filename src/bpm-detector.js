'use strict';

/* eslint "no-console": 0 */

var WAITING_THRESHOLD = 5000,
    TIMER_LENGTH = 10000,
    DECAY_THRESHOLD_RATE = 0.8,
    DECAY_THRESHOLD_MULTIPLIER = 0.005;

// TODO v2:
// pick the top 3 estimations
// group the rest of the estimations around these 3 top picks
// in terms of the closest to each pick
// priority goes: top -> down
function BPMDetector(eventBus) {
  this._eventBus = eventBus;

  this.bootstrapDefaults();
}

BPMDetector.prototype.bootstrapDefaults = function() {
  var self = this;

  this.peaks = [];
  this.beginTime = 0;
  this.tempo = 0;
  this.currentInterval = 0;
  this._lastTempo = 0;
  this._tempoCount = 0;
  this._lastPeak = 0;
  this._timer = TIMER_LENGTH;
  this._decayThresholdRate = DECAY_THRESHOLD_RATE;

  if (this.worker) {
    this.worker.terminate();
  }

  this.worker = new Worker('./src/detector-worker.js');

    this.worker.onmessage = function(e) {
      self.calculate(e.data);
    };
};

BPMDetector.prototype.begin = function() {
  if (this.beginTime) {
    return;
  }

  this.beginTime = performance.now();

  console.log('BPM DETECTION START');
};

BPMDetector.prototype.controlPeakThreshold = function(peakDetect) {
  if (!this.beginTime) {
    return;
  }

  var decayThresholdRate = this._decayThresholdRate;

  // reset decay threshold rate
  if (decayThresholdRate < 0.6) {
    decayThresholdRate = this._decayThresholdRate = DECAY_THRESHOLD_RATE;
  }

  peakDetect.threshold = peakDetect.energy * decayThresholdRate;

  this._decayThresholdRate -= DECAY_THRESHOLD_MULTIPLIER;
};

BPMDetector.prototype.getIntervalFromTempo = function(tempo) {
  if (!tempo) {
    return;
  }

  return Math.round((60 / tempo) * 1000);
};

BPMDetector.prototype.trackPeak = function() {
  var eventBus = this._eventBus;

  var now, length;

  if (!this.beginTime) {
    return;
  }

  this._lastPeak = now = performance.now();

  this.peaks.push(now - this.beginTime);

  if (this.currentInterval) {
    if (Math.round(now - this.peaks[this.peaks.length - 2]) === this.currentInterval) {
      eventBus.fire('bpm-detector.sync', { interval: this.currentInterval });
    }
  }

  length = this.peaks.length;

  if (this.peaks[length - 1] - this.peaks[length - 2] > WAITING_THRESHOLD) {
    console.log('WAITING_THRESHOLD EXCEEDED');

    this.bootstrapDefaults();

    this.begin();

    eventBus.fire('bpm-detector.reset');
  } else if (now && now - this.beginTime > this._timer) {
    this._timer += TIMER_LENGTH;

    return this.calculateTempos();
  }
};

BPMDetector.prototype.calculateTempos = function() {
  this.worker.postMessage(this.peaks);
};

BPMDetector.prototype.calculate = function(tempos) {
  var tempo;

  if (!tempos) {
    return;
  }

  // sort by count
  tempos.sort(function(a, b) {
    return a.count > b.count ? -1 : 1;
  });

  if (tempos.length <= 2) {
    return;
  }

  tempo = tempos[0].tempo;

  if (tempo === this._lastTempo) {
    this._tempoCount++;
  } else {
    this._lastTempo = tempo;
    this._tempoCount = 1;
  }

  console.log('ESTIMATED TEMPO: ', tempo);
  console.log('TEMPOS: ', tempos, tempos.length);
  console.log('PEAKS: ', this.peaks.length);
  console.log('\n');

  // ASSUME that after 3 tries
  // the tempo is correct
  if (this._tempoCount === 3) {
    this.tempoLock(tempo);
  } else if (this._timer >= 300000) {
    // reset or it will start to get too performance expensive
    console.log('TIMER EXCEEDED MAX - FLUSHING DATA');

    this.tempoLock(this._tempoCount === 3 ? tempo : this._lastLockedTempo);

    this.bootstrapDefaults();

    this.begin();
  }
};

BPMDetector.prototype.tempoLock = function(tempo) {
  var eventBus = this._eventBus;

  var interval;

  console.log('TEMPO LOCKED AT:', tempo);

  this.tempo = tempo;

  interval = this.currentInterval = this.getIntervalFromTempo(this.tempo);

  eventBus.fire('bpm-detector.tempo', {
    tempo: tempo,
    interval: interval
  });

  this._lastLockedTempo = tempo;

  this._tempoCount = 0;
};
