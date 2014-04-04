/**
The main application module for the Jester's Sevens app.

@module app
@class J7App
@extends EventTarget
**/
define(
    ["xlib/EventTarget", 
     "data/ScoreCounter",
     "ui/GameBoard", "ui/ScoreView",
     "app/SelectWheelDlg", "app/ScoreDetailsDlg", "app/BonusDetailsDlg",
     "jquery"],
    function(EventTarget, 
             ScoreCounter, 
             GameBoard, ScoreView,
             SelectWheelDlg, ScoreDetailsDlg, BonusDetailsDlg)
{
    "use strict";

    /**
        The J7App object.
        @constructor
    */
    function J7App() {
        EventTarget.call(this);

        this.debugSpins = [ [7,4,2], [1,2,3], [2,2,5], [1,2,2], [5,2,1], [3,7,4] ];

        this.numWheels = 3;
        this.wheels = [];
        for (var i = 0 ; i < this.numWheels ; i++)
            this.wheels.push({val:0, used:false});
        this.scoreCounter = new ScoreCounter();
        this.scoreView = new ScoreView(this.scoreCounter);
    }

    J7App.prototype = new EventTarget();
    J7App.prototype.constructor = J7App;

    J7App.prototype.init = function() {
        var self = this;

        self.selectWheelDlg = new SelectWheelDlg(self);
        self.scoreDetailsDlg = new ScoreDetailsDlg(self);
        self.bonusDetailsDlg = new BonusDetailsDlg(self);
        $(".inGameControls button").click(function(e) { self.onGameControlClick(e); });
        $("#btnPass").click(function() { self.onPass(); });
        $("#btnNewGame").click(function(e) { self.onNewGame(); });
        $("#btnCashOut").click(function(e) { self.onCashOut(); });
        $(".btnScoreInfo").click(function() { self.showScoreDetails(); });
        $(".btnBonusInfo").click(function() { self.showBonusDetails(); });

        self.gameBoard = new GameBoard();
        self.onNewGame();
    };

    J7App.prototype.onNewGame = function(e) {
        var self = this;
        self.stats = { 
            spins:0,
            plays:[],
            passes: 0,
            triples:0,
            opening7s: 0,
            openingTriples: 0,
            thirteens: 0,
            opening13s: 0
        };
        self.scoreCounter.startGame(self.stats);
        self.curPlay = null;
        self.gameBoard.clearBoard();
        self.scoreView.clear();
        $(".inGameControls").show();
        $(".gameOverControls").hide();
        self.onSpin();
    };

    J7App.prototype.onCashOut = function() {
        debugger;
    };

    J7App.prototype.onEndSpin = function() {
        var self = this;
        var v1 = this.wheels[0].val, v2 = this.wheels[1].val, v3 = this.wheels[2].val;
        var inOpeningBonus = self.checkOpeningBonus();
        if (inOpeningBonus) {
            var sum = v1 + v2 + v3;
            if (sum % 7 === 0) {
                self.scoreCounter.scoreOpeningSevens();
                self.markPlayedCellsAsBonus();
                self.stats.opening7s++;
            }
        }
        self.checkTriplePlay(inOpeningBonus);
        self.checkThirteen(inOpeningBonus);
    };

    J7App.prototype.onGameOver = function() {
        var self = this;

        $(".inGameControls").hide();
        $(".gameOverControls").show();

        // score unused bonuses
        var bonusStats = self.countBonuses();
        var count = bonusStats.bonusesEarned.total - bonusStats.bonusesUsed;
        if (count > 0)
            self.scoreCounter.scoreUnusedBonuses(count);
        self.updateStats();

        // TODO: save the stats

        self.scoreView.addTickerText(self.stats.spins, "G A M E   O V E R");
    };

    J7App.prototype.onCellClick = function(e) {
        var self = this;
        var cellVal = parseInt($(e.target).attr("data-val")), checkVal = cellVal;

        self.gameBoard.playCell(cellVal);
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
        var c1 = self.gameBoard.getCell(colIdx), c2 = self.gameBoard.getCell(colIdx + 7),
            c3 = self.gameBoard.getCell(colIdx + 14);
        if (c1.isPlayed() && c2.isPlayed() && c3.isPlayed()) {
            c1.setBonus(); c2.setBonus(); c3.setBonus();
            self.scoreCounter.scoreUpAndDown(colIdx - 1);
        }

        // check across bonus
        var rowIdx = self.scoreCounter.valRow(cellVal);
        var i, count = 0;
        for (i = (rowIdx - 1) * 7 + 1 ; i <= rowIdx * 7 ; i++) {
            if (self.gameBoard.getCell(i).isPlayed())
                count++;
        }
        if (count == 7) {
            for (i = (rowIdx - 1) * 7 + 1 ; i <= rowIdx * 7 ; i++)
                self.gameBoard.getCell(i).setBonus();
            self.scoreCounter.scoreAcross(rowIdx - 1);
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

    J7App.prototype.checkThirteen = function(inOpeningBonus) {
        var self = this;
        var sum = self.getPlayedVal(0) + self.getPlayedVal(1) + self.getPlayedVal(2);
        if (sum === 13) {
            self.markPlayedCellsAsPenalty();
            if (inOpeningBonus)
                self.stats.opening13s++;
            else
                self.stats.thirteens++;
            self.scoreCounter.scoreThirteen(inOpeningBonus);
        }
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
        for (i = 1 ; i <= 7 ; i++) {
            var c1 = self.gameBoard.getCell(i), c2 = self.gameBoard.getCell(i + 7),
                c3 = self.gameBoard.getCell(i + 14);
            if (c1.isPlayed() && c2.isPlayed() && c3.isPlayed()) {
                result.bonusesEarned.upAndDown++;
            }
        }

        // count filled rows
        for (i = 0 ; i < 3 ; i++) {
            var count = 0;
            for (var j = i * 7 + 1 ; j <= (i + 1) * 7 ; j++) {
                if (self.gameBoard.getCell(j).isPlayed())
                    count++;
            }
            if (count == 7) {
                result.bonusesEarned.across++;
            }
        }

        var bonusNames = ["respins", "doubles", "increments", "decrements", 
                          "busts", "thirteens", "opening13s"];
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

    J7App.prototype.getPlayedVal = function(wheelNum) {
        var result = 0, self = this;
        if (self.wheels[wheelNum].used && !self.wheels[wheelNum].busted)
            result = self.wheels[wheelNum].val;
        return result;
    };

    J7App.prototype.markPlayedCellsAsBonus = function() {
        var self = this;
        self.curPlay.cellsPlayed.forEach(function(cellVal) {
            self.gameBoard.setBonusCell(cellVal);
        });
    };

    J7App.prototype.markPlayedCellsAsPenalty = function() {
        var self = this;
        self.curPlay.cellsPlayed.forEach(function(cellVal) {
            self.gameBoard.setPenaltyCell(cellVal);
        });
    };

    J7App.prototype.showBonusDetails = function() {
        var bonusInfo = this.countBonuses();
        this.bonusDetailsDlg.show(bonusInfo);
    };

    J7App.prototype.showScoreDetails = function() {
        this.scoreDetailsDlg.show(this.scoreCounter.scores);
    };

    J7App.prototype.setValidCells = function() {
        var self = this;

        $(".cellMarker").unbind("click");
        self.gameBoard.clearValidCells();

        function checkWheels(indices) {
            var valid = true, sum = 0;
            indices.forEach(function(index) {
                valid &= !self.wheels[index].used;
                sum += self.wheels[index].val;
            });
            if (valid && sum > 0 && sum <= 21) {
                self.gameBoard.setValidCell(sum);
            }
        }

        checkWheels([0]); checkWheels([1]); checkWheels([2]);
        checkWheels([0,1]); checkWheels([0,2]); checkWheels([1,2]);
        checkWheels([0,1,2]);

        var $validCells = $(".valid-cell");
        if ($validCells.length === 0) {
            var wheelsUsed = 0;
            self.wheels.forEach(function(wheel) {
                if (wheel.used)
                    wheelsUsed++;
            });

            // the game is over when all cells have been played
            var playedCells = $(".played-cell").length;
            if (playedCells == $(".cellMarker").length) {
                self.onGameOver();
            } else if (wheelsUsed == self.numWheels) {
                self.onEndSpin();
                self.onSpin();
            } else {
                var gameOver = true;    // assume the worst
                var bonusStats = self.countBonuses();
                if (bonusStats.bonusesEarned.total > bonusStats.bonusesUsed) {
                    gameOver = false;
                } else {
                    if (wheelsUsed == 0) {
                        var canPass = ($("#btnPass").attr("disabled") != "disabled");
                        if (canPass) {
                            gameOver = false;
                            var msg = "No valid plays but you can pass";
                            self.scoreView.addTickerText(self.stats.spins, msg);
                        }
                    }
                }
                if (gameOver)
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

    J7App.prototype.useWheel = function(index, busted) {
        var $wheels = $(".wheel");
        if (index >= 0 && index < $wheels.length) {
            var $wheel = $($wheels[index]);
            $wheel.addClass("usedwheel");
            this.wheels[index].used = true;
            if (busted)
                this.wheels[index].busted = busted;
        }
    };


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
                self.selectWheelDlg.show(buttonTitle);
                break;
        }
    };

    J7App.prototype.onPass = function() {
        var self = this;
        self.scoreView.addTickerText(self.stats.spins, "Spin passed");
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

        $("#spinsVal").text(self.stats.spins);
        $("#bdgPass").text(self.stats.passes);

        var bonusStats = self.countBonuses(),
            bonusesAvailable = bonusStats.bonusesEarned.total - bonusStats.bonusesUsed;
        $("#bdgBonuses").text(bonusesAvailable);
        self.enableGameControls(bonusesAvailable > 0);

        // TODO: move this to the BonusDetailsDlg
        function statLine(name, val) {
            var line = $('<div class="statLine"><div class="statName"></div><div class="statVal"></div></div>');
            line.find(".statName").text(name);
            line.find(".statVal").text(val);
            if (name === "Total") {
                line.find(".statName").css("border-top", "1px solid black");
                line.find(".statVal").css("border-top", "1px solid black");
            }
            return line;
        }

        var earnedNames = ["opening7s", "openingTriples", "triples", "upAndDown", "across"],
            usedNames = ["respins", "doubles", "increments", "decrements", "busts"];
        var $statsUI;

        $statsUI = $(".earnedBonusDetails");
        $statsUI.empty();
        earnedNames.forEach(function(name) {
            $statsUI.append(statLine(name, (bonusStats.bonusesEarned[name] || 0)));
        });
        $statsUI.append(statLine(" ", " "));
        $statsUI.append(statLine("Total", (bonusStats.bonusesEarned.total || 0)));

        $statsUI = $(".usedBonusDetails");
        $statsUI.empty();
        usedNames.forEach(function(name) {
            $statsUI.append(statLine(name, (self.stats[name] || 0)));
        });
        $statsUI.append(statLine("thirteens", self.stats.opening13s + self.stats.thirteens));
        $statsUI.append(statLine("Total", bonusStats.bonusesUsed));
    };

    J7App.prototype.useAdjustment = function(type) {
        var self = this;
        if (self.stats[type] === undefined)
            self.stats[type] = 0;
        self.stats[type] += 1;
        self.updateStats();
    };

    return J7App;
});
