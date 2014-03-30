'use strict';

var Evernote = require('evernote').Evernote;
var DOMParser = require('xmldom').DOMParser;
var config = require('./config');

//var developerToken = config.token;
//var client = new Evernote.Client({token: developerToken});
 
// Set up the NoteStore client 
//var noteStore = client.getNoteStore();

function getNoteStore(req, res) {
    var noteStore;
    var client;
    if (req.session.oauthAccessToken) {
        var token = req.session.oauthAccessToken;
        client = new Evernote.Client({
            token: token,
            sandbox: config.SANDBOX
        });
        noteStore = client.getNoteStore();
    }
    else if (config.use_developer_token) {
        client = new Evernote.Client({token: config.token});
        noteStore = client.getNoteStore();
    }
    
    if (noteStore) {
        return noteStore;
    }
    else {
        console.log('Not signed in');

        res.redirect('/login');

        return false;
    }
}
 
// Make API calls
exports.listNotebooks = function (req, res, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }
    
    noteStore.listNotebooks(function (err, notebooks) {
        if (err) {
            console.log(err);
            callback(err);
        }
        else {
            callback(err, notebooks);
        }
    });
};

exports.findNotesMetadata = function (req, res, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }

    var filter = new Evernote.NoteFilter();
    filter.ascending = false;
    filter.order = 1;
    var offset = 0;
    var maxNotes = 15;
    var resultSpec = new Evernote.NotesMetadataResultSpec();
    resultSpec.includeTitle = true;

    noteStore.findNotesMetadata(filter, offset, maxNotes, resultSpec, function(err, notes) {
        if (err) {
            console.log(err);
            callback(err);
        }
        else {
            req.session.notes = notes;
            callback(err, notes);
        }
    });
};

exports.getNotebook = function (req, res, guid, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }

    noteStore.getNotebook(guid, function(err, notebooks) {
        if (err) {
            console.log(err);
            callback(err);
        }
        else {
            callback(err, notebooks);
        }
    });
};

exports.getNote = function (req, res, guid, options, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }

    var withContent = options.content || false;
    var withResourcesData = options.resourcesData || false;
    var withResourcesRecognition = options.resourcesRecognition || false;
    var withResourcesAlternateData = options.resourcesAlternateData || false;
    noteStore.getNote(guid,
                        withContent,
                        withResourcesData,
                        withResourcesRecognition,
                        withResourcesAlternateData,
                        function(err, note) {
        if (err) {
            console.log('Couldn\'t get note: '+ guid);
            console.log(err);
            callback(err);
        }
        else {
            var xmlContent = new DOMParser().parseFromString(note.content, 'text/xml');
            var content = xmlContent.getElementsByTagName('en-note')[0];
            note.content = getChildNodeValues(content);
            callback(err, note);
        }
    });
};

exports.createNote = function (req, res, noteTitle, noteBody, parentNotebook, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }

    var nBody = '<?xml version="1.0" encoding="UTF-8"?>';
    nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    nBody += '<en-note>' + noteBody + '</en-note>';
 
    // Create note object
    var ourNote = new Evernote.Note();
    if (noteTitle === '') {
        ourNote.title = 'Untitled';
    }
    else {
        ourNote.title = noteTitle;
    }
    ourNote.content = nBody;
 
    // parentNotebook is optional; if omitted, default notebook is used
    if (parentNotebook && parentNotebook.guid) {
        ourNote.notebookGuid = parentNotebook.guid;
    }
 
    // Attempt to create note in Evernote account
    noteStore.createNote(ourNote, function (err, note) {
        if (err) {
            // Something was wrong with the note data
            // See EDAMErrorCode enumeration for error code explanation
            // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
            console.log('Error creating note:');
            console.log(err);
            callback(err);
        } else {
            callback(err, note);
        }
    });
 
};

exports.updateNote = function (req, res, guid, noteTitle, noteBody, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }

    var nBody = '<?xml version="1.0" encoding="UTF-8"?>';
    nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    nBody += '<en-note>' + noteBody + '</en-note>';

    // Create note object
    var ourNote = new Evernote.Note();
    ourNote.guid = guid;
    if (noteTitle === '') {
        ourNote.title = 'Untitled';
    }
    else {
        ourNote.title = noteTitle;
    }
    ourNote.content = nBody;

    // Attempt to update note in Evernote account
    noteStore.updateNote(ourNote, function (err, note) {
        if (err) {
            // Something was wrong with the note data
            // See EDAMErrorCode enumeration for error code explanation
            // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
            console.log('Error updating note:');
            console.log(err);
            callback(err);
        } else {
            callback(err, note);
        }
    });
};

exports.trashNote = function (req, res, guid, callback) {
    var noteStore = getNoteStore(req, res);
    if (!noteStore) { return; }

    noteStore.deleteNote(guid, function (err, note) {
        if (err) {
            console.log(err);
            callback(err);
        }
        else {
            callback(err, note);
        }
    });
};

// Recursively goes through child nodes and gets the values
function getChildNodeValues(node) {
    if (node.hasChildNodes()) {
        var values = '';
        for (var i = 0; i < node.childNodes.length; i += 1) {
            // TODO change to context sensitive new lines
            values += getChildNodeValues(node.childNodes[i]) + '\n';
        }
        return values;
    }
    // TODO check if value has multiple instances of &nbsp;
    else if (node.nodeValue && node.nodeValue !== '&nbsp;') {
        return node.nodeValue;
    }
    else {
        return '';
    }
}