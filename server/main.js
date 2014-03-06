var express = require('express'), utils = require('./utils');
var app = express();

app.use(express.static(__dirname + '/../app'));
app.listen(3001);
