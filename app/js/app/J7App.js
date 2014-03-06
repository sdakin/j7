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

        $("#btnSpin").click(function(e) { self.onSpin(); });
        $("#btnNewGame").click(function(e) { self.onNewGame(); });

        self.onSpin();
    };

    J7App.prototype.getCell = function(value) {
        return $(".cell[data-val='" + value + "']");
    };

    J7App.prototype.onNewGame = function(e) {
        $(".cell").removeClass("playedcell");
        var $gameControls = $("#controlArea").children();
        $gameControls.last().hide();
        $gameControls.first().show();
        this.onSpin();
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

    J7App.prototype.onSpin = function() {
        var self = this;
        // TODO: move this to the server so the user can't modify it
        $(".wheel").each(function(index, wheel) {
            var spin = Math.ceil(Math.random() * 7);
            self.setWheel(index, spin);
        });
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

            // the game is over if there are no valid cells and all wheels have not been used
            if (wheelsUsed != this.numWheels) {
                var $gameControls = $("#controlArea").children();
                $gameControls.first().hide();
                $gameControls.last().show();
            } else {
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

    return J7App;
});
