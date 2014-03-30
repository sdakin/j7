define(["xlib/EventTarget"], function(EventTarget)
{
    "use strict";

    function ScoreCounter() {
        EventTarget.call(this);
        this.startGame();
    }

    ScoreCounter.prototype = new EventTarget();
    ScoreCounter.prototype.constructor = ScoreCounter;

    ScoreCounter.OPENINGBONUS_CHANGED = "OpeningBonusChanged";
    ScoreCounter.SCORE_CHANGED = "ScoreChanged";
    ScoreCounter.SCORE_MESSAGE = "ScoreMessage";

    ScoreCounter.prototype.checkOpeningBonus = function(wheels, plays) {
        function checkSpin(spin, includePass) {
            var v1 = spin[0], v2 = spin[1], v3 = spin[2];
            var sum = v1 + v2 + v3;
            if (sum % 7 === 0) return true;
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

        this.setOpeningBonus(isBonus);
        return isBonus;
    };

    ScoreCounter.prototype.setOpeningBonus = function(flag) {
        if (flag !== this.openingBonus) {
            this.openingBonus = flag;
            var event = {
                type: ScoreCounter.OPENINGBONUS_CHANGED,
                bonus: flag
            };
            this.fire(event);
        }
    };

    ScoreCounter.prototype.startGame = function(initGameStats) {
        this.setScore(0);
        this.setOpeningBonus(true);
        this.rowsPlayed = [];
        this.colsPlayed = [];
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
            triples: 0,
            upAndDowns: 0,
            acrosses: 0,
            unusedBonuses: 0,
            openingThirteens: 0,
            thirteens: 0
        };
        this.gameStats = initGameStats;
    };

    ScoreCounter.prototype.addToScore = function(amount) {
        this.setScore(this.score + amount);
    };

    ScoreCounter.prototype.setScore = function(val) {
        this.score = val;
        var event = {
            type: ScoreCounter.SCORE_CHANGED,
            score: val
        };
        this.fire(event);
    };

    // returns the ordinal position of the column (1..7) of the specified value
    ScoreCounter.prototype.valCol = function(val) {
        return ((val - 1) % 7) + 1;
    };

    // returns the ordinal position of the row (1, 2, 3) of the specified value
    ScoreCounter.prototype.valRow = function(val) {
        return Math.floor((val - 1) / 7) + 1;
    };

    ScoreCounter.prototype.scoreAcross = function(rowIndex) {
        var lowerPlayed = 0;
        for (var i = 0 ; i < rowIndex ; i++) {
            if (this.rowsPlayed.indexOf(i) >= 0)
                lowerPlayed++;
        }
        this.rowsPlayed.push(rowIndex);
        var bonus = 100, bonusPts = (rowIndex + 1) * bonus - (lowerPlayed * bonus);
        this.scores.acrosses += bonusPts;
        this.addToScore(bonusPts);
    };

    ScoreCounter.prototype.scoreCell = function(val) {
        var row = this.valRow(val) - 1, pointVals = [15, 10, 25],
            categories = ["lower row", "middle row", "upper row"],
            points = pointVals[row];
        this.scores.cells[categories[row]] += points;
        this.addToScore(points);
        this.scoreMessage("" + val + " covered for " + points + " points");
    };

    ScoreCounter.prototype.scoreMessage = function(message) {
        var e = {
            type: ScoreCounter.SCORE_MESSAGE,
            spinNum: this.gameStats.spins,
            msg: message
        };
        this.fire(e);
    };

    ScoreCounter.prototype.scoreOpeningSevens = function() {
        var self= this;
        self.scores.opening7s += self.opening7sBonus;
        self.addToScore(self.opening7sBonus);
        self.scoreMessage("Opening sevens bonus for " + self.opening7sBonus + " points");
        self.opening7sBonus *= 2;
    };

    ScoreCounter.prototype.scoreThirteen = function(inOpeningBonus) {
        if (inOpeningBonus) {
            this.thirteenPenalty *= 2;
            this.scores.openingThirteens += this.thirteenPenalty;
        } else {
            this.scores.thirteens += this.thirteenPenalty;
        }
        this.addToScore(this.thirteenPenalty);
        this.thirteenPenalty *= 2;
    };

    ScoreCounter.prototype.scoreTriple = function(val, inOpeningBonus) {
        var bonuses = [25, 50, 100],
            bonusPts = 3 * bonuses[this.valRow(val) - 1];
        if (inOpeningBonus) {
            bonusPts *= 2;
            this.scores.openingTriples += bonusPts;
        } else
            this.scores.triples += bonusPts;
        this.addToScore(bonusPts);
    };

    ScoreCounter.prototype.scoreUnusedBonuses = function(count) {
        var bonus = 25, bonusPts = 0;
        for (var i = 0 ; i < count ; i++) {
            bonusPts += bonus;
            bonus += 25;
        }
        this.scores.unusedBonuses = bonusPts;
        this.addToScore(bonusPts);
    };

    ScoreCounter.prototype.scoreUpAndDown = function(colIndex) {
        var lowerPlayed = 0;
        for (var i = 0 ; i < colIndex ; i++) {
            if (this.colsPlayed.indexOf(i) >= 0)
                lowerPlayed++;
        }
        this.colsPlayed.push(colIndex);
        var bonus = 25, bonusPts = (colIndex + 1) * bonus - (lowerPlayed * bonus);
        this.scores.upAndDowns += bonusPts;
        this.addToScore(bonusPts);
    };

    return ScoreCounter;
});
