'use strict';
var express = require('express');
var routes = require('./routes');
var path = require('path');

var model = require('./evernoteModel');

var app = express();

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.bodyParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);

app.get('/notebooks', function (req, res) {
	model.listNotebooks(function (notebooks) {
		res.send(200, notebooks);
	});
});

app.get('/notebook/:guid', function (req, res) {
	var guid = req.params.guid;
	model.getNotebook(guid, function (notebook) {
		res.send(200, notebook);
	});
});

app.get('/notes', function (req, res) {
	model.findNotesMetadata(function (noteData) {
		//console.log('noteData',noteData);
		noteData.notes.forEach(function (note) { note.url = '/notes/' + note.guid;});
		res.send(200, noteData);
	});
});

app.get('/notes/:noteId', function (req, res) {
	var noteId = req.params.noteId;
	var options = { 'content': true };
	model.getNote(noteId, options, function (note) {
		res.send(200, note);
	});
});

app.post('/createNote', function (req, res) {
	var title = req.body.title,
		body = req.body.content || '';
	model.createNote(title, body, {}, function( note ) {
	  res.send(200, note);
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
	model.updateNote(guid, title, body, function() {
		res.send(200);
	});
});

app.del('/notes/:guid', function (req, res) {
	model.trashNote(req.params.guid, function (err, note) {
		if (err) {
			res.send(500, err);
		}
		res.send(200);
	});
});


app.listen(8080);
console.log('Server started. Listening on port 8080...');