define([], function()
{
    "use strict";

    function BonusDetailsDlg() {
        var self = this;
        self.$dlg = $("#bonusDetailsDlg");
        self.$dlg.click(function() { self.hide(); });
    }

    BonusDetailsDlg.prototype.hide = function() {
        this.$dlg.hide();
    };

    BonusDetailsDlg.prototype.show = function(bonusInfo) {
        var $details = $("#bonusDetails");

        // TODO: add bonus detail items...

        this.$dlg.show();
    };

    return BonusDetailsDlg;
});
