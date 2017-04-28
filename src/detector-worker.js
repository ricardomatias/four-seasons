'use strict';

var LOWER_LIMIT = 334,
    UPPER_LIMIT = 667;

onmessage = function(e) {
  var tempos = calcTempos(e.data);

  postMessage(tempos);
};

function calcTempos(peaks) {
  var intervalCounts = [],
      tempos = [],
      interval, tempo, matching, idx, initialInterval;

  // - calculate all the intervals (ms) between peaks
  for (idx = 0; idx < peaks.length - 1; idx++) {
    interval = peaks[idx + 1] - peaks[idx];

    intervalCounts.push(Math.round(interval));
  }

  // - group the intervals (ms)
  for (idx = 0; idx < intervalCounts.length; idx++) {
    initialInterval = intervalCounts[idx];
    interval = intervalCounts[idx];
    matching = intervalCounts.indexOf(interval);

    if (interval < LOWER_LIMIT) {
      continue;
    }

    // ASSUME IT's double the speed
    if (interval > UPPER_LIMIT) {
      initialInterval = interval /= 2;
    }

    // - including 1ms far away neighbours
    tempo = _calcTempo(intervalCounts, matching, interval, initialInterval);

    tempos.push(tempo);
  }

  // sort by count
  tempos.sort(function(a, b) {
    return a.count > b.count ? -1 : 1;
  });

  if (tempos.length <= 2) {
    return;
  }

  // make sure there's only one group for each tempo
  // [ the grouped intervals have been converted into tempo (BPM) ]
  for (idx = 0; idx < tempos.length; idx++) {
    tempo = tempos[idx].tempo;

    for (var innerIdx = 0; innerIdx < tempos.length; innerIdx++) {
      if (idx !== innerIdx && idx < tempos.length && tempo === tempos[innerIdx].tempo) {
        tempos[idx].count += tempos[innerIdx].count;

        tempos.splice(innerIdx, 1);
      }
    }
  }

  return tempos;
}

function _calcTempo(coll, matching, interval, initialInterval) {
  var result = interval,
      count = 0;

  // count matching intervals
  while (matching !== -1) {
    count++;

    coll.splice(matching, 1);

    matching = coll.indexOf(interval);
  }

  // group intervals 1ms longer
  matching = coll.indexOf(interval + 1);

  if (matching !== -1) {
    result = (result + coll[matching]) / 2;
  }

  while (matching !== -1) {
    count++;

    coll.splice(matching, 1);

    matching = coll.indexOf(initialInterval + 1);
  }

  // group intervals 1ms shorter
  matching = coll.indexOf(initialInterval - 1);

  if (matching !== -1) {
    result = (result + coll[matching]) / 2;
  }

  while (matching !== -1) {
    count++;

    coll.splice(matching, 1);

    matching = coll.indexOf(initialInterval - 1);
  }

  return {
    tempo: Math.round(60 / (result / 1000)),
    count: count
  };
}
