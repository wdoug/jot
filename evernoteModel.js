'use strict';

var Evernote = require('evernote').Evernote;
var config = require('./config');

var developerToken = config.token;

var client = new Evernote.Client({token: developerToken});
 
// Set up the NoteStore client 
var noteStore = client.getNoteStore();
 
// Make API calls
exports.listNotebooks = function (callback) {
    noteStore.listNotebooks(function (err, notebooks) {
        if (err) {
            console.log(err);
        }
        else {
            callback(err, notebooks);
        }
    });
};

exports.findNotesMetadata = function (callback) {
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
        }
        else {
            callback(err, notes);
        }
    });
};

exports.getNotebook = function (guid, callback) {
    noteStore.getNotebook(guid, function(err, notebooks) {
        if (err) {
            console.log(err);
        }
        else {
            callback(err, notebooks);
        }
    });
};

exports.getNote = function (guid, options, callback) {
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
        }
        else {
            callback(err, note);
        }
    });
};

exports.createNote = function (noteTitle, noteBody, parentNotebook, callback) {
 
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
    } else {
        callback(err, note);
    }
    });
 
};

exports.updateNote = function (guid, noteTitle, noteBody, callback) {
    var nBody = '<?xml version="1.0" encoding="UTF-8"?>';
    nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    nBody += noteBody.replace('<!--?xml version="1.0" encoding="UTF-8"?-->', '');

    console.log('content: ' + nBody);
 
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
    } else {
        callback(err, note);
    }
    });
};

exports.trashNote = function (guid, callback) {
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

function logErrors(err, data, callback) {
    if (err) {
        console.log(err);
    }
    else {
        callback(data);
    }
}
