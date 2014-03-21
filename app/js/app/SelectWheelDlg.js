define([], function()
{
    "use strict";

    function SelectWheelDlg(initApp) {
        var self = this;

        self.app = initApp;
        self.$overlay = $("#selectWheelDlg");
        self.$dlg = $("#selectWheel");
        $("#btnCancel").click(function(e) { self.hide(); });
        var $buttons = $("#selectWheel button:not(:last)");
        $buttons.click(function(e) { self.onSelectWheel(e); });
        var index = 0;
        self.app.wheels.forEach(function(wheel) {
            if (self.app.wheels[index].used)
                $($buttons[index]).attr("disabled", "disabled");
            else
                $($buttons[index]).removeAttr("disabled");
        });
    }

    SelectWheelDlg.prototype.onSelectWheel = function(e) {
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

    SelectWheelDlg.prototype.hide = function() {
        this.$overlay.hide();
    };

    SelectWheelDlg.prototype.show = function (type) {
        var self = this;
        self.mode = type;
        var $board = $(".board"), boardPos = $board.offset(),
            boardWidth = $board.outerWidth(), boardHeight = $board.outerHeight();
        var $selector = $("#selectWheel");
        var $wheelSelectors = $selector.find('button:not(:last)'), $wheels = $(".wheel");

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
        var $rollArea = $(".rollArea");
        var offset = $rollArea.offset();
        offset.top -= 44;
        offset.left = 15;
        this.$dlg.offset(offset);
    };

    return SelectWheelDlg;
});
