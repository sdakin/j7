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

        this.wheels = [0, 0, 0];
    }

    J7App.prototype = new EventTarget();
    J7App.prototype.constructor = J7App;

    // TODO: events fired by this object

    J7App.prototype.init = function() {
        var self = this;

        $("#btnSpin").click(function(e) { self.onSpin(); });

        self.onSpin();
    };

    J7App.prototype.getCell = function(value) {
        return $(".cell[data-val='" + value + "']");
    };

    J7App.prototype.onCellClick = function(e) {
        $(e.target).addClass("playedcell");
        $(e.target).removeClass("validcell");
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
        $(".validcell").unbind("click");
        $(".cell").removeClass("validcell");
        self.getCell(self.wheels[0]).addClass("validcell");
        self.getCell(self.wheels[1]).addClass("validcell");
        self.getCell(self.wheels[2]).addClass("validcell");
        self.getCell(self.wheels[0] + self.wheels[1]).addClass("validcell");
        self.getCell(self.wheels[0] + self.wheels[2]).addClass("validcell");
        self.getCell(self.wheels[1] + self.wheels[2]).addClass("validcell");
        self.getCell(self.wheels[0] + self.wheels[1] + self.wheels[2]).addClass("validcell");
        $(".validcell").click(function(e) { self.onCellClick(e); });
    };

    J7App.prototype.setWheel = function(index, value) {
        var $wheels = $(".wheel");
        if (index >= 0 && index < $wheels.length) {
            this.wheels[index] = value;
            $($wheels[index]).text(value);
        }
    };

    return J7App;
});
