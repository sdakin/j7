define([], function()
{
    "use strict";

    function ScoreCounter() {
    	this.$scoreUI = $("#scoreVal");
    	this.startGame();
    	this.opening7sBonus = 100;
    	this.openingTriplesBonus = 100;
    	this.thirteenPenalty = -100;
    	this.scores = {
    		cells: {
    			"lower row": 0,
    			"middle row": 0,
    			"upper row": 0
    		},
    		opening7s: 0,
    		openingTriples: 0,
    		triples: 0
    	};
    }

    ScoreCounter.prototype.checkOpeningBonus = function(wheels, plays) {
    	function checkSpin(spin, includePass) {
    		var v1 = spin[0], v2 = spin[1], v3 = spin[2];
    		var sum = v1 + v2 + v3;
    		if (sum % 7 == 0) return true;
    		if (sum == 13) return true;
    		if (v1 == v2 && v2 == v3) return true;
    		if (includePass) {
	    		var validPass = (v1 == v2 + v3 || v2 == v1 + v3 || v3 == v1 + v2);
    			if (validPass) return true;
    		}

    		return false;
    	}

    	var curSpin = [wheels[0].val, wheels[1].val, wheels[2].val];
    	var isBonus = checkSpin(curSpin, true);
    	if (isBonus) {
    		plays.every(function(play) {
    			isBonus &= (play.pass || checkSpin(play.endSpin));
    			return isBonus;
    		});
    	}

    	if (isBonus) {
    		$("#openingBonus").show();
    	} else {
    		$("#openingBonus").hide();
    	}
    	return isBonus;
    };

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
		var row = this.valRow(val), pointVals = [15, 10, 25],
			categories = ["lower row", "middle row", "upper row"],
			points = pointVals[row];
		this.scores.cells[categories[row]] += points;
		this.addToScore(points);
	};

	ScoreCounter.prototype.scoreOpeningSevens = function() {
		var self= this;
		self.scores.opening7s += self.opening7sBonus;
		self.addToScore(self.opening7sBonus);
		self.opening7sBonus *= 2;
	};

	ScoreCounter.prototype.scoreTriple = function(val, inOpeningBonus) {
		var bonuses = [25, 50, 100],
			bonusPts = 3 * bonuses[this.valRow(val)];
		if (inOpeningBonus) {
			bonusPts *= 2;
			this.scores.openingTriples += bonusPts;
		} else
			this.scores.triples += bonusPts;
		this.addToScore(bonusPts);
	};

    return ScoreCounter;
});
