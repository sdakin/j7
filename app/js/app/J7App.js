/**
The main application module for the Jester's Sevens app.

@module app
@class J7App
@extends EventTarget
**/
define(
    ["xlib/EventTarget", "app/ScoreCounter", "ui/Cell", "jqueryUI"],
    function(EventTarget, ScoreCounter, Cell)
{
    "use strict";

    /**
        The J7App object.
        @constructor
    */
    function J7App() {
        EventTarget.call(this);

//        this.debugSpins = [ [6,6,2], [4,4,4], [7,7,7], [5,2,1], [3,7,4] ];

        this.numWheels = 3;
        this.wheels = [];
        this.scoreCounter = new ScoreCounter();
        for (var i = 0 ; i < this.numWheels ; i++)
            this.wheels.push({val:0, used:false});
    }

    J7App.prototype = new EventTarget();
    J7App.prototype.constructor = J7App;

    J7App.prototype.init = function() {
        var self = this;

        self.selectWheelOverlay = new SelectWheelOverlay(self);
        $(".inGameControls button").click(function(e) { self.onGameControlClick(e); });
        $("#btnPass").click(function() { self.onPass(); });
        $("#btnNewGame").click(function(e) { self.onNewGame(); });

        self.cells = [];
        for (var i = 1 ; i <= 21 ; i++)
            self.cells.push(new Cell(i));

        self.onNewGame();
    };

    J7App.prototype.onNewGame = function(e) {
        var self = this;
        self.stats = { 
            spins:0,
            plays:[],
            triples:0,
            opening7s: 0,
            openingTriples: 0
        };
        self.scoreCounter.startGame();
        var $cells = $(".boardCell");
        $cells.removeClass("playedcell");
        $cells.removeClass("bonuscell");
        var $gameControls = $("#controlArea").children();
        $gameControls.last().hide();
        $gameControls.first().show();
        self.onSpin();
    };

    J7App.prototype.onEndSpin = function() {
        var self = this;
        var v1 = this.wheels[0].val, v2 = this.wheels[1].val, v3 = this.wheels[2].val;
        var inOpeningBonus = self.checkOpeningBonus();
        if (inOpeningBonus) {
            var sum = v1 + v2 + v3;
            if (sum % 7 == 0) {
                self.scoreCounter.scoreOpeningSevens();
                self.markPlayedCellsAsBonus();
                self.stats.opening7s++;
            }
        }
        self.checkTriplePlay(inOpeningBonus);
    };

    J7App.prototype.onGameOver = function() {
        var $gameControls = $("#controlArea").children();
        $gameControls.first().hide();
        $gameControls.last().show();

        // TODO: save the stats
    };

    J7App.prototype.onCellClick = function(e) {
        var self = this;
        var cellVal = parseInt($(e.target).text()), checkVal = cellVal;

        $(e.target).removeClass("validcell");
        $(e.target).addClass("playedcell");
        self.scoreCounter.scoreCell(cellVal);

        function checkCells(indices) {
            var sum = 0, valid = true, checkSum = 0;
            indices.forEach(function(index) {
                valid &= !self.wheels[index].used;
                checkSum += self.wheels[index].val;
            });
            if (valid && checkVal == checkSum) {
                checkVal -= checkSum;
                indices.forEach(function(index) {
                    self.useWheel(index);
                });
            }
        }

        if (cellVal) {
            checkCells([0]); checkCells([1]); checkCells([2]);
            checkCells([0,1]); checkCells([0,2]); checkCells([1,2]);
            checkCells([0,1,2]);
        }

        // check up&down bonus
        var colIdx = self.scoreCounter.valCol(cellVal);
        var c1 = self.cells[colIdx], c2 = self.cells[colIdx + 7], c3 = self.cells[colIdx + 14];
        if (c1.isPlayed() && c2.isPlayed() && c3.isPlayed()) {
            c1.setBonus(); c2.setBonus(); c3.setBonus();
            self.scoreCounter.scoreUpAndDown(colIdx);
        }

        // check across bonus
        var rowIdx = self.scoreCounter.valRow(cellVal);
        var i, count = 0;
        for (var i = rowIdx * 7 ; i < (rowIdx + 1) * 7 ; i++) {
            if (self.cells[i].isPlayed())
                count++;
        }
        if (count == 7) {
            for (i = rowIdx * 7 ; i < (rowIdx + 1) * 7 ; i++)
                self.cells[i].setBonus();
            self.scoreCounter.scoreAcross(rowIdx);
        }

        self.curPlay.cellsPlayed.push(cellVal);
        self.setValidCells();
        self.updateStats();
    };

    J7App.prototype.checkOpeningBonus = function() {
        var self = this;
        return self.scoreCounter.checkOpeningBonus(self.wheels, self.stats.plays);
    };

    J7App.prototype.checkPass = function() {
        var $wheels = $(".wheel");
        var v1 = parseInt($($wheels[0]).text()),
            v2 = parseInt($($wheels[1]).text()),
            v3 = parseInt($($wheels[2]).text()),
            validPass = (v1 == v2 + v3 || v2 == v1 + v3 || v3 == v1 + v2);
        if (validPass)
            $("#btnPass").removeAttr("disabled");
        else
            $("#btnPass").attr("disabled", "disabled");
    };

    J7App.prototype.checkTriplePlay = function(inOpeningBonus) {
        var v1 = this.wheels[0].val, v2 = this.wheels[1].val, v3 = this.wheels[2].val,
            triples = (v1 == v2 && v2 == v3);
        if (triples) {
            var self = this;
            self.markPlayedCellsAsBonus();
            if (inOpeningBonus)
                self.stats.openingTriples++;
            else
                self.stats.triples++;
            self.scoreCounter.scoreTriple(v1 * 3, inOpeningBonus);
            self.updateStats();
        }
    };

    J7App.prototype.countBonuses = function() {
        var self = this;
        var i, result = {
            bonusesEarned: {
                opening7s: self.stats.opening7s,
                openingTriples: self.stats.openingTriples,
                triples: self.stats.triples,
                upAndDown: 0,
                across: 0
            },
            bonusesUsed: 0
        };

        // count filled columns
        for (i = 0 ; i < 7 ; i++) {
            var c1 = self.cells[i], c2 = self.cells[i + 7], c3 = self.cells[i + 14];
            if (c1.isPlayed() && c2.isPlayed() && c3.isPlayed()) {
                result.bonusesEarned.upAndDown++;
            }
        }

        // count filled rows
        for (i = 0 ; i < 3 ; i++) {
            var count = 0;
            for (var j = i * 7 ; j < (i + 1) * 7 ; j++) {
                if (self.cells[j].isPlayed())
                    count++;
            }
            if (count == 7) {
                result.bonusesEarned.across++;
            }
        }

        var bonusNames = ["respins", "doubles", "increments", "decrements", "busts"];
        bonusNames.forEach(function(name) {
            result.bonusesUsed += (self.stats[name] || 0);
        });

        var totalBonuses = 0;
        for (var prop in result.bonusesEarned) {
            totalBonuses += result.bonusesEarned[prop];
        }
        result.bonusesEarned.total = totalBonuses;

        return result;
    };

    J7App.prototype.markPlayedCellsAsBonus = function() {
        var self = this;
        self.curPlay.cellsPlayed.forEach(function(cellVal) {
            self.cells[cellVal - 1].setBonus();
        });
    };

    J7App.prototype.setValidCells = function() {
        var self = this;
        $(".boardCell").unbind("click");
        $(".boardCell").removeClass("validcell");

        function checkWheels(indices) {
            var valid = true, sum = 0;
            indices.forEach(function(index) {
                valid &= !self.wheels[index].used;
                sum += self.wheels[index].val;
            });
            if (valid && sum >= 0 && sum < 21) {
                var cell = self.cells[sum - 1];
                if (!cell.isPlayed())
                    cell.setValid();
            }
        }

        checkWheels([0]); checkWheels([1]); checkWheels([2]);
        checkWheels([0,1]); checkWheels([0,2]); checkWheels([1,2]);
        checkWheels([0,1,2]);

        var $validCells = $(".validcell");
        if ($validCells.length == 0) {
            var wheelsUsed = 0;
            this.wheels.forEach(function(wheel) {
                if (wheel.used)
                    wheelsUsed++;
            });

            // the game is over when all cells have been played
            var playedCells = $(".playedcell").length;
            if (playedCells == $(".boardCell").length) {
                self.onGameOver();
            } else if (wheelsUsed == self.numWheels) {
                self.onEndSpin();
                self.onSpin();
            } else {
                var bonusStats = self.countBonuses();
                if (bonusStats.bonusesEarned.total == bonusStats.bonusesUsed)
                    self.onGameOver();
            }
        } else {
            $validCells.click(function(e) { self.onCellClick(e); });
        }
    };

    J7App.prototype.setWheel = function(index, value) {
        var $wheels = $(".wheel");
        if (index >= 0 && index < $wheels.length) {
            this.wheels[index] = {val:value, used:false};
            var $wheel = $($wheels[index]);
            $wheel.text(value);
            $wheel.removeClass("usedwheel");
        }
    };

    J7App.prototype.useWheel = function(index) {
        var $wheels = $(".wheel");
        if (index >= 0 && index < $wheels.length) {
            var $wheel = $($wheels[index]);
            $wheel.addClass("usedwheel");
            this.wheels[index].used = true;
        }
    }


    // ---------- Game Controls ----------

    J7App.prototype.enableGameControls = function(flag) {
        var self = this;
        var $controls = $("#controlArea .inGameControls .adjustments button");
        $controls.each(function(index, button) {
            if (flag)
                $(button).removeAttr("disabled");
            else
                $(button).attr("disabled", "disabled");
        });

        if (flag) {
            var $spin = $("#btnSpin");
            var used = false;
            self.wheels.forEach(function(wheel) {
                used |= wheel.used;
            });
            if (used)
                $spin.attr("disabled", "disabled");
            else
                $spin.removeAttr("disabled");
        }
    };

    J7App.prototype.onGameControlClick = function(e) {
        var self = this, buttonTitle = $(e.target).text().toLowerCase();
        switch (buttonTitle) {
            case "respin":
                self.useAdjustment("respins");
                self.onSpin();
                break;
            case "double":
            case "+1":
            case "-1":
            case "bust":
                self.selectWheelOverlay.show(buttonTitle);
                break;
        }
    };

    J7App.prototype.onPass = function() {
        var self = this;
        if (self.stats.passes === undefined)
            self.stats.passes = 0;
        self.stats.passes += 1;
        self.curPlay.pass = true;
        self.updateStats();
        self.onSpin();
    };

    J7App.prototype.onSpin = function() {
        var self = this;
        
        if (self.curPlay) {
            self.curPlay.endSpin = [self.wheels[0].val, self.wheels[1].val, self.wheels[2].val];
            self.stats.plays.push(self.curPlay);
        }
        self.curPlay = {};
        self.curPlay.startSpin = [];
        self.curPlay.cellsPlayed = [];

        // TODO: move this to the server so the user can't modify it
        if (self.debugSpins && self.debugSpins.length > 0) {
            var debugSpin = self.debugSpins.shift();
            for (var i = 0 ; i < debugSpin.length ; i++)
                self.setWheel(i, debugSpin[i]);
            self.curPlay.startSpin = debugSpin[i];
        } else {
            $(".wheel").each(function(index, wheel) {
                var spin = Math.ceil(Math.random() * 7);
                self.setWheel(index, spin);
                self.curPlay.startSpin.push(spin);
            });
        }
        self.checkOpeningBonus();
        self.checkPass();
        self.setValidCells();
        self.stats.spins++;
        self.updateStats();
    };

    J7App.prototype.updateStats = function() {
        var self = this;
        var statNames = ["spins", "passes"];
        var earnedNames = ["opening7s", "openingTriples", "triples", "upAndDown", "across"],
            usedNames = ["respins", "doubles", "increments", "decrements", "busts"];
        var $statLine = $('<div class="statLine"><div class="statName"></div><div class="statVal"></div></div>');
        var $newStatLine;

        var $statsUI = $("#gameStats");
        $statsUI.empty();
        statNames.forEach(function(name) {
            $newStatLine = $statLine.clone();
            $newStatLine.find(".statName").text(name);
            $newStatLine.find(".statVal").text((self.stats[name] || 0));
            $statsUI.append($newStatLine);
        });

        var bonusStats = self.countBonuses();
        self.enableGameControls(bonusStats.bonusesEarned.total > bonusStats.bonusesUsed);

        $statsUI = $(".earnedBonusDetails");
        $statsUI.empty();
        earnedNames.forEach(function(name) {
            $newStatLine = $statLine.clone();
            $newStatLine.find(".statName").text(name);
            $newStatLine.find(".statVal").text((bonusStats.bonusesEarned[name] || 0));
            $statsUI.append($newStatLine);
        });
        $newStatLine = $statLine.clone();
        $newStatLine.find(".statName").text("Total");
        $newStatLine.find(".statVal").text((bonusStats.bonusesEarned.total || 0));
        $statsUI.append($newStatLine);

        $statsUI = $(".usedBonusDetails");
        $statsUI.empty();
        usedNames.forEach(function(name) {
            $newStatLine = $statLine.clone();
            $newStatLine.find(".statName").text(name);
            $newStatLine.find(".statVal").text((self.stats[name] || 0));
            $statsUI.append($newStatLine);
        });
        $newStatLine = $statLine.clone();
        $newStatLine.find(".statName").text("Total");
        $newStatLine.find(".statVal").text(bonusStats.bonusesUsed);
        $statsUI.append($newStatLine);
    };

    J7App.prototype.useAdjustment = function(type) {
        var self = this;
        if (self.stats[type] === undefined)
            self.stats[type] = 0;
        self.stats[type] += 1;
        self.updateStats();
    };


    // ---------- Select Wheel Overlay ----------

    function SelectWheelOverlay(initApp) {
        var self = this;

        self.app = initApp;
        self.$overlay = $("#modalOverlay");
        $("#btnCancel").click(function(e) { self.hide(); });
        var $buttons = $("#selectWheel button");
        $buttons.click(function(e) { self.onSelectWheel(e); });
        var index = 0;
        self.app.wheels.forEach(function(wheel) {
            if (self.app.wheels[index].used)
                $($buttons[index]).attr("disabled", "disabled");
            else
                $($buttons[index]).removeAttr("disabled");
        });
    }

    SelectWheelOverlay.prototype.onSelectWheel = function(e) {
        var self = this;
        var index = parseInt($(e.target).attr("id").substr(8)) - 1;
        var $wheels = $(".wheel");
        var origVal = parseInt($($wheels[index]).text()), curVal = origVal;

        switch (self.mode) {
            case "double":
                curVal *= 2; self.app.useAdjustment("doubles"); break;
            case "+1":
                curVal++; self.app.useAdjustment("increments"); break;
            case "-1":
                curVal--; self.app.useAdjustment("decrements"); break;
            case "bust":
                self.app.useWheel(index);
                self.app.useAdjustment("busts");
                break;
        }
        if (origVal != curVal) {
            self.app.setWheel(index, curVal);
            self.app.checkOpeningBonus();
        }
        self.hide();
        self.app.setValidCells();
    };

    SelectWheelOverlay.prototype.hide = function() {
        this.$overlay.hide();
    };

    SelectWheelOverlay.prototype.show = function (type) {
        var self = this;
        self.mode = type;
        var $board = $(".board"), boardPos = $board.offset(),
            boardWidth = $board.outerWidth(), boardHeight = $board.outerHeight();
        var $selector = $("#selectWheel");
        var $wheelSelectors = $selector.children(), $wheels = $(".wheel");

        $("#selectPrompt").text("Select wheel to " + type);
        $selector.width(boardWidth);
        for (var i = 0 ; i < self.app.numWheels ; i++) {
            $($wheelSelectors[i]).text($($wheels[i]).text());
            
            // disable buttons for wheels that are already used
            if (self.app.wheels[i].used)
                $($wheelSelectors[i]).attr("disabled", "disabled");
            else
                $($wheelSelectors[i]).removeAttr("disabled");
        }
        this.$overlay.show();
    };

    return J7App;
});
