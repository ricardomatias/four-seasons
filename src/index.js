'use strict';

/* exported setup draw windowResized */

var presets = new PresetsManager(),
		eventBus = new EventBus();

var sketch = new Sketch({
	colors: [
		[ '#000000', '#FFFFFF' ],
		[ '#152B3C', '#E32D40' ],
		[ '#11644D', '#F2C94E' ],
		[ '#C02942', '#ECD078' ],
		[ '#FAFCD9', '#FC4416' ]
	]
});

sketch.setup(function() {
	createCanvas(windowWidth, windowHeight);

	// SETUP VARIABLES
	this.SAMPLE_AMOUNT = 128;

	this.setNewColorScheme();

	// SETUP PEAKDETECT
	this.peakDetect = new p5.PeakDetect(20, 4000, 0.05);

	// SETUP FILTER
	this.filter = new p5.LowPass();
	this.filter.disconnect();

	// SETUP MIC
	this.mic = new p5.AudioIn();

	this.mic.disconnect();
	this.mic.connect(this.filter);

	this.mic.start();

	// TEMPO
	this.detector = new BPMDetector(eventBus, sampleRate());
	this.masterClock = new MasterClock(eventBus, getAudioContext());

	eventBus.on('bpm-detector.tempo', function(payload) {
		var tempo = payload.tempo;

		if (!this.masterClock.isRunning) {
			this.masterClock.start(tempo);
		}
	}, this);

	eventBus.on('bpm-detector.reset', function() {
		this.masterClock.stop();
	}, this);

	eventBus.on('bpm-detector.sync', function(payload) {
		this.masterClock.sync(payload.interval, payload.time);
	}, this);

	eventBus.on('master-clock.tick', function(payload) {
		if (payload.tick === 0) {
			presets.selectRandom();
		}
	});

	// SETUP PRESETS
	presets.register('simple', {
		smoothing: 0.1
	});

	presets.register('moving', {
		smoothing: 0.9,
		trebleAgent: new Agent(0, 0, 1, 0, { friction: 0.98 }),
		bassAgent: new Agent(0, 0, 1, 0, { friction: 0.98 })
	});

	presets.register('moving-separate', {
		smoothing: 0.9,
		trebleAgent: new Agent(0, 0, 1, 0, { friction: 0.98 }),
		bassAgent: new Agent(0, 0, 1, 0, { friction: 0.98 })
	});

	presets.register('triangle', {
		smoothing: 0.9,
		trebleAgent: new Agent(0, 0, 1, 0, { friction: 0.98 }),
		bassAgent: new Agent(0, 0, 1, 0, { friction: 0.98 })
	});

	presets.setup([ 'simple', 'moving', 'moving-separate', 'triangle' ], function(defaults) {
		// SETUP FFT ANALYSIS
		this.fft = new p5.FFT(defaults.smoothing, this.SAMPLE_AMOUNT);

		this.fft.setInput(this.mic);

		this.detector.begin();

	}, this);

	presets.select('moving-separate');

	// SHORTCUTS
	this.registerShortcuts([
		{
			key: 'w',
			action: function() {
				redraw();

				presets.selectPrevious();
			}
		},
		{
			key: 's',
			action: function() {
				redraw();

				presets.selectNext();
			}
		},
		{
			key: 'r',
			action: function() {
				redraw();

				presets.selectRandom();
			}
		},
		{
			key: 'h',
			action: function() {
				Helpers.hideClutter();
			}
		},
		{
			key: 'Space',
			action: function() {
				this.setNewColorScheme();
			}
		},
		{
			key: 'Enter',
			action: function() {
				this.takeScreenshot(presets.getActiveName());
			}
	}]);
});

sketch.draw(function()  {
	var halfWidth = windowWidth / 2,
			halfHeight = windowHeight / 2,
			backgroundColor = this.backgroundColor,
			fillColor = this.fillColor;

	var fft = this.fft;

	fft.analyze();

	// PEAKDETECT ANALYSIS
	this.peakDetect.update(fft);

	if (this.peakDetect.isDetected) {
		this.detector.controlPeakThreshold(this.peakDetect);

		this.detector.trackPeak();
	}

	// VISUALS
	noStroke();

	background(backgroundColor);

	presets.draw('simple', function() {
		var bassEnergy = fft.getEnergy('bass'),
				midEnergy = fft.getEnergy('mid'),
				trebleEnergy = fft.getEnergy('treble');

		fill(this.toRGB(fillColor, bassEnergy));

		rect(0, 0, halfWidth, windowHeight);

		fill(this.toRGB(fillColor, trebleEnergy));

		rect(halfWidth, 0, windowWidth, windowHeight);

		fill(this.toRGB(fillColor, midEnergy));

		rect(halfWidth / 2, halfHeight / 2, windowWidth - halfWidth, windowHeight - halfHeight);
	}, this);


	presets.draw('moving', function(defaults) {
		var trebleAgent = defaults.trebleAgent,
				bassAgent = defaults.bassAgent;

		var bassEnergy = fft.getEnergy('bass'),
				midEnergy = fft.getEnergy('mid'),
				trebleEnergy = fft.getEnergy('treble');

		var rectWidth = halfWidth / 4;

		trebleAgent.accelerateTo(trebleEnergy, 0, 10);

		trebleAgent.update();

		bassAgent.accelerateTo(bassEnergy, 0, 1);

		bassAgent.update();

		fill(this.toRGB(fillColor, trebleAgent.x));

		rect(map(trebleEnergy, 0, 255, 0, windowWidth - rectWidth), 0, rectWidth, windowHeight);

		fill(this.toRGB(fillColor, midEnergy));

		rect(map(midEnergy, 0, 255, 0, windowWidth - rectWidth), 0, rectWidth, windowHeight);

		fill(this.toRGB(fillColor, bassAgent.x));

		var bassWidth = map(bassEnergy, 0, 255, 0, rectWidth);

		rect(map(bassEnergy, 0, 255, 0, windowWidth - rectWidth), 0, bassWidth, windowHeight);
	}, this);


	presets.draw('moving-separate', function(defaults) {
		var trebleAgent = defaults.trebleAgent,
				bassAgent = defaults.bassAgent;

		var bassEnergy = fft.getEnergy('bass'),
				midEnergy = fft.getEnergy('mid'),
				trebleEnergy = fft.getEnergy('treble');

		var rectWidth = halfWidth / 4;

		trebleAgent.accelerateTo(trebleEnergy, 0, 10);

		trebleAgent.update();

		bassAgent.accelerateTo(bassEnergy, 0, 10);

		bassAgent.update();

		fill(this.toRGB(fillColor, bassAgent.x));

		var trebleX = map(trebleEnergy, 0, 255, windowWidth - halfWidth, windowWidth - rectWidth);

		rect(trebleX, 0, rectWidth, windowHeight);

		fill(this.toRGB(fillColor, midEnergy));

		var midWidth = map(midEnergy, 0, 255, 0, halfWidth / 2);

		rect(halfWidth - (midWidth / 2), 0, midWidth, windowHeight);

		fill(this.toRGB(fillColor, trebleAgent.x));

		var bassX = map(bassEnergy, 0, 255, windowWidth, 0),
				bassWidth = map(bassEnergy, 0, 255, 0, rectWidth * 1.25);

		rect(bassX, 0, bassWidth, windowHeight);
	}, this);


	presets.draw('triangle', function(defaults) {
		var trebleAgent = defaults.trebleAgent,
				bassAgent = defaults.bassAgent;

		var bassEnergy = fft.getEnergy('bass'),
				midEnergy = map(this.mic.getLevel(), 0, 0.4, 0, 255),
				trebleEnergy = fft.getEnergy('treble');

		trebleAgent.accelerateTo(trebleEnergy, 0, 10);

		trebleAgent.update();

		bassAgent.accelerateTo(bassEnergy, 0, 1);

		bassAgent.update();

		fill(this.toRGB(fillColor, bassAgent.x));

		beginShape();

		vertex(0, 0);
		vertex(halfWidth, windowHeight);
		vertex(0, windowHeight);

		endShape(CLOSE);

		fill(this.toRGB(fillColor, midEnergy));

		beginShape();

		vertex(0, 0);
		vertex(halfWidth, windowHeight);
		vertex(windowWidth, 0);

		endShape(CLOSE);

		fill(this.toRGB(fillColor, trebleAgent.x));

		beginShape();

		vertex(windowWidth, 0);
		vertex(halfWidth, windowHeight);
		vertex(windowWidth, windowHeight);

		endShape(CLOSE);
	}, this);
});

function setup() {
	sketch.setup();
}

function draw() {
	sketch.draw();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}
