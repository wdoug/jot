'use strict';

var noteIndex = 0;

// Once this is implemented: http://bugs.jquery.com/ticket/12031
// This class definition can be cleaned up

// TODO put methods in Node.prototype
var Note = function (title, content, guid) {
    var note = $('<div class="note">' +
        '<input type="text" class="title" placeholder="Title">' +
        '<textarea class="content" placeholder="note" style="resize:none;"></textarea>' +
        '<div class="options">' +
            '<input type="button" class="trash" value="Trash"></input>' +
        '</div>' +
      '</div>');
    note.find('.content').autosize();
    if (title !== undefined && title !== 'Untitled') {
        note.find('.title').val(title);
    }
    else {
        note.find('.title').hide();
    }
    if (content !== undefined && content !== null) {
        note.find('.content').val(content).trigger('autosize.resize');
    }

    if (guid !== undefined && guid !== '') {
        note.attr('data-guid', guid);
    }
    else {
        note.addClass('new-note');
    }
    note.on('input', '.title, .content', function () {
        note.addClass('changed');
    });
    note.on('focus', '.title, .content', function () {
        note.addClass('active');
        note.find('.title').show();
    });
    note.on('blur',  '.title, .content', function () {
        note.removeClass('active');
        var $title = note.find('.title');
        if ( $title.val() === '') {
            $title.hide();
        }
    });
    note.on('click', '.trash', function () {
        if (guid !== undefined) {
            $.ajax('/notes/' + guid, {
                type: 'DELETE'
            });
            noteIndex -= 1;
        }
        // TODO: Check if this will cause memory leaks 
        // from old references
        note.remove();
    });

    return note;
};

function loadNotes(startIndex, numNotes) {
    $.get('/notes/start/' + startIndex + '/total/' + numNotes, function ( data ) {
        for (var i = 0; i < data.notes.length; ++i) {
            $('#notes').append(
                new Note(data.notes[i].title, null, data.notes[i].guid).addClass('loading')
            );
            noteIndex += 1;
        }
    }).then( function () {
        $('.note.loading').each( function (index, element) {
            $.get('notes/' + $( element ).data('guid'), function ( note ) {
                $( element ).find('.content').val( note.content ).trigger('autosize.resize');
                $( element ).removeClass('loading');
            });
        });
    });
}

function loadSequentialNotes(numNotes) {
    loadNotes(noteIndex, numNotes);
}

$( document ).ready( function () {

    $('#notes').prepend( new Note() );

    $('#new-note-button').on('click', function() {
        $('#notes').prepend( new Note() );
    });

    loadSequentialNotes(15);

    $('#load-notes-button').on('click', function () {
        loadSequentialNotes(15);
    });

    // Sync
    $('#sync-button').on('click', function () {
        $('.note.new-note').each( function (index, element) {
            var noteContent = {
                'title': $( element ).find('.title').val(),
                'content': $( element ).find('.content').val()
            };
            if (noteContent.title !== '' || noteContent.content !== '') {
                $.post('/createNote', noteContent, function ( response ) {
                    $( element ).attr('data-guid', response.guid);
                    $( element ).removeClass('new-note').removeClass('changed');
                    noteIndex += 1;
                });
            }
        });

        $('.note.changed').each( function (index, element) {
            $.ajax('/updateNote', {
                type: 'PUT',
                dataType: 'json',
                data: {
                    'guid': $(this).data('guid'),
                    'title': $(this).find('.title').val(),
                    'content': $(this).find('.content').val()
                },
                success: function ( response ) {
                    console.log('' + response + ' updated note success');
                    $(this).removeClass('changed');
                }
            });
        });
    });
});