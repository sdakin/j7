requirejs.config({
    "baseUrl": "js",

    "paths": {
      "jquery": "../xlib/jq/jquery2.0.3.min",
      "jqueryUI": "../xlib/jq/jquery-ui.min",
      "bootstrap": "../xlib/tbs/js/bootstrap.min"
    },

    // jquery and its plugins are not require modules: this is the way to mimic that.
    // See <https://github.com/requirejs/example-jquery-shim/blob/master/www/js/app.js>
    "shim": {
      "jqueryUI": ['jquery'],
      "bootstrap": ["jquery"]
    }
});

// The app singleton object.
var gApp;

define(["app/J7App"], function(J7App) {
  "use strict";

  gApp = new J7App();
  gApp.init();
});
