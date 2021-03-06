'use strict';
var express = require('express');
var http = require('http');
var routes = require('./routes');
var path = require('path');

var config;
// If config.json isn't defined use environment variables
try {
    config = require('./config.json');
}
catch(err) {
    config = {
        'cookie_parser_secret': process.env.COOKIE_SECRET
    };
}

var model = require('./evernoteModel');
var login = require('./evernoteLogin');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser(config.cookie_parser_secret));
app.use(express.session());

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}


app.get('/', routes.index);

app.get('/login', login.oauth);
app.get('/oauth_callback', login.oauth_callback);
app.get('/logout', login.clear);


app.get('/notebooks', function (req, res) {
    model.listNotebooks(req, res, function (err, notebooks) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, notebooks);
        }
    });
});

app.get('/notebook/:guid', function (req, res) {
    var guid = req.params.guid;
    model.getNotebook(req, res, guid, function (err, notebook) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, notebook);
        }
    });
});

app.get('/notes', function (req, res) {
    var options = { };
    model.findNotesMetadata(req, res, options, function (err, noteData) {
        //console.log('noteData',noteData);
        noteData.notes.forEach(function (note) { note.url = '/notes/' + note.guid;});
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, noteData);
        }
    });
});

app.get('/notes/start/:startNote/total/:numNotes', function (req, res) {
    var options = {
        offset: req.params.startNote,
        maxNotes: req.params.numNotes
    };
    model.findNotesMetadata(req, res, options, function (err, noteData) {
        //console.log('noteData',noteData);
        noteData.notes.forEach(function (note) { note.url = '/notes/' + note.guid;});
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, noteData);
        }
    });
});

app.get('/notes/:noteId', function (req, res) {
    var noteId = req.params.noteId;
    var options = { 'content': true };
    model.getNote(req, res, noteId, options, function (err, note) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, note);
        }
    });
});

app.post('/createNote', function (req, res) {
    var title = req.body.title,
        body = req.body.content || '';
    model.createNote(req, res, title, body, {}, function (err, note) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(201, note);
        }
    });
});
/* $.get('/notes/' + id)
$.get(url)
*/
app.put('/updateNote', function (req, res) {
    var guid = req.body.guid,
        title = req.body.title || '',
        body = req.body.content || '';
    console.log('Going to update note...');
    console.log('title: ' + title);
    console.log('guid: ' + guid);
    model.updateNote(req, res, guid, title, body, function (err, note) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200);
        }
    });
});

app.del('/notes/:guid', function (req, res) {
    model.trashNote(req, res, req.params.guid, function (err, note) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200);
        }
    });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
