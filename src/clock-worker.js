'use strict';

/* eslint "no-console": 0 */

var INTERVAL = 100;

var timer,
    interval = INTERVAL,
    firstRound = false;

onmessage = function(e) {
  'use strict';
  var data = e.data;

  // start timer
  if (data.action === 'start') {
    timer = setInterval(function() {
      postMessage(performance.now());
    }, interval);
  }

  // sync timer
  else if (data.action === 'sync') {
    interval = data.interval;
    firstRound = true;

    clearInterval(timer);

    timer = setInterval(function() {
      if (firstRound) {
        interval = INTERVAL;

        firstRound = false;
      }

      postMessage(performance.now());
    }, interval);
	}

  // stop timer
  else if (data.action === 'stop') {
    console.log('timer stop');

		clearInterval(timer);
		timer = undefined;
	}
};
