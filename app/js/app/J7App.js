/**
The main application module for the Jester's Sevens app.

@module app
@class J7App
@extends EventTarget
**/
define(
    ["xlib/EventTarget", "jqueryUI"],
    function(EventTarget)
{
    "use strict";

    /**
        The J7App object.
        @constructor
    */
    function J7App() {
        EventTarget.call(this);

        this.numWheels = 3;
        this.wheels = [];
        for (var i = 0 ; i < this.numWheels ; i++)
            this.wheels.push({val:0, used:false});
    }

    J7App.prototype = new EventTarget();
    J7App.prototype.constructor = J7App;

    // TODO: events fired by this object

    J7App.prototype.init = function() {
        var self = this;

        self.selectWheelOverlay = new SelectWheelOverlay(self);
        $(".inGameControls button").click(function(e) { self.onGameControlClick(e); });
        $("#btnNewGame").click(function(e) { self.onNewGame(); });

        self.onNewGame();
    };

    J7App.prototype.getCell = function(value) {
        return $(".cell[data-val='" + value + "']");
    };

    J7App.prototype.onNewGame = function(e) {
        var self = this;
        self.stats = { spins:0 };
        $(".cell").removeClass("playedcell");
        var $gameControls = $("#controlArea").children();
        $gameControls.last().hide();
        $gameControls.first().show();
        self.onSpin();
    };

    J7App.prototype.onGameOver = function() {
        var $gameControls = $("#controlArea").children();
        $gameControls.first().hide();
        $gameControls.last().show();

        // TODO: save the stats
    };

    J7App.prototype.onCellClick = function(e) {
        var self = this;
        var cellVal = parseInt($(e.target).text());

        $(e.target).addClass("playedcell");
        $(e.target).removeClass("validcell");

        function checkCells(indices) {
            var sum = 0, valid = true, checkSum = 0;
            indices.forEach(function(index) {
                valid &= !self.wheels[index].used;
                checkSum += self.wheels[index].val;
            });
            if (valid && cellVal == checkSum) {
                cellVal -= checkSum;
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

        self.setValidCells();
    };

    J7App.prototype.setValidCells = function() {
        var self = this;
        $(".cell").unbind("click");
        $(".cell").removeClass("validcell");

        function checkWheels(indices) {
            var valid = true, sum = 0;
            indices.forEach(function(index) {
                valid &= !self.wheels[index].used;
                sum += self.wheels[index].val;
            });
            if (valid) {
                var $cell = self.getCell(sum);
                if (!$cell.hasClass("playedcell"))
                    $cell.addClass("validcell");
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
            if (playedCells == $(".cell").length) {
                self.onGameOver();
            } else if (wheelsUsed == self.numWheels) {
                self.onSpin();
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

    J7App.prototype.onGameControlClick = function(e) {
        var self = this, buttonTitle = $(e.target).text().toLowerCase();
        switch (buttonTitle) {
            case "spin":
                self.onSpin(); break;
            case "double":
            case "+1":
            case "-1":
            case "bust":
                self.selectWheelOverlay.show(buttonTitle);
                break;
        }
    };

    J7App.prototype.onSpin = function() {
        var self = this;
        // TODO: move this to the server so the user can't modify it
        $(".wheel").each(function(index, wheel) {
            var spin = Math.ceil(Math.random() * 7);
            self.setWheel(index, spin);
        });
        self.setValidCells();
        self.stats.spins++;
        self.updateStats();
    };

    J7App.prototype.updateStats = function() {
        var self = this;
        var $statsUI = $("#gameStats"); $statsUI.empty();
        var statNames = ["spins", "doubles", "increments", "decrements"];
        statNames.forEach(function(name) {
            var $statLine = $('<div class="statLine"></div>');
            $statLine.append($('<div class="statName">' + name + '</div><div class="statVal">' +
                (self.stats[name] || 0) + '</div>'));
            $statsUI.append($statLine);
        });
    };

    J7App.prototype.useAdjustment = function(type) {
        if (this.stats[type] === undefined)
            this.stats[type] = 0;
        this.stats[type] += 1;
        this.updateStats();
    };


    // ---------- Select Wheel Overlay ----------

    function SelectWheelOverlay(initApp) {
        var self = this;

        self.app = initApp;
        self.$overlay = $("#modalOverlay");
        $("#btnCancel").click(function(e) { self.hide(); });
        $("#selectWheel button").click(function(e) { self.onSelectWheel(e); });
    }

    SelectWheelOverlay.prototype.onSelectWheel = function(e) {
        var self = this;
        var index = parseInt($(e.target).attr("id").substr(8)) - 1;
        var $selector = $("#selectWheel");
        var $wheels = $(".wheel"), $wheelSelectors = $selector.children();
        var curVal = parseInt($($wheels[index]).text());

        switch (self.mode) {
            case "double":
                curVal *= 2; self.app.useAdjustment("doubles"); break;
            case "+1":
                curVal++; self.app.useAdjustment("increments"); break;
            case "-1":
                curVal--; self.app.useAdjustment("decrements"); break;
        }
        self.app.setWheel(index, curVal);
        $($wheelSelectors[index]).text(curVal);
        self.hide();
        self.app.setValidCells();
    };

    SelectWheelOverlay.prototype.hide = function() {
        this.$overlay.hide();
    };

    // TODO: disable buttons for wheels that are already used
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
        }
        this.$overlay.show();
    };

    return J7App;
});
