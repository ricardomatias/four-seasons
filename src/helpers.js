'use strict';

/* exported Helpers */

var Helpers = {
  toggleOverlay: function toggleOverlay() {
    var overlay = Array.from(document.getElementsByClassName('overlay'))[0];

    overlay.classList.toggle('hidden');
  },
  genUID: function genUID() {
    var str = '';

    for (var idx = 0; idx < 6; idx++) {
      if (idx % 2 === 0) {
        str += String.fromCharCode(Math.floor(Math.random() * 25) + 97);
      } else {
        str += Math.floor(Math.random() * 10);
      }
    }

    return str;
  },
  hideClutter: function hideClutter() {
    var clutter = Array.from(document.getElementsByClassName('clutter'));

    clutter.forEach(function(element) {
      element.classList.toggle('hidden');
    });
  }
};
