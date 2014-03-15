define([], function()
{
    "use strict";

    function ScoreCounter() {
    	this.$scoreUI = $("#scoreVal");
    	this.startGame();
    }

    ScoreCounter.prototype.startGame = function() {
    	this.setScore(0);
    	this.openingBonus = true;
	};

	ScoreCounter.prototype.addToScore = function(amount) {
		this.setScore(this.score + amount);
	};

	ScoreCounter.prototype.setScore = function(val) {
		this.score = val;
		this.$scoreUI.text(val);
	};

	// returns the ordinal row index (0, 1, 2) of the specified value
	ScoreCounter.prototype.valRow = function(val) {
		return Math.floor((val - 1) / 7);
	};

	ScoreCounter.prototype.scoreCell = function(val) {
		var points = [15, 10, 25];
		this.addToScore(points[this.valRow(val)]);
	};

	ScoreCounter.prototype.scoreTriple = function(val) {
		var bonuses = [25, 50, 100];
		this.addToScore(3 * bonuses[this.valRow(val)]);
	};

    return ScoreCounter;
});
