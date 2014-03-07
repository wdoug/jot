'use strict';

// Once this is implemented: http://bugs.jquery.com/ticket/12031
// This class definition can be cleaned up

// TODO put methods in Node.prototype
var Note = function (title, content, guid) {
	var note = $('<div class="note">' +
        '<input type="text" class="title" placeholder="Title"></input>' +
        '<div contenteditable class="content" data-placeholder="note"></div>' +
        '<div class="options">' +
        	'<input type="button" class="trash" value="Trash"></input>' + 
        '</div>' +
      '</div>');
	if (title !== undefined) {
		note.find('.title').val(title);
	}
	else {
		note.find('.title').hide();
	}
	if (content !== undefined) {
		note.find('.content').append(content)
		                     .on('click', 'a', function () {
			// TODO: Handle link clicks
			console.log( 'Clicked link: ' + $(this).attr('href') );
		});
	}
	if (guid !== undefined) {
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
		}
		// TODO: Check if this will cause memory leaks 
		// from old references
		note.remove();
	});

	return note;
};

$( document ).ready( function () {
	// Older versions of Android don't support contentEditable
	// will need some sort of fallback in future (Possibly to textarea).
	// This check's if it is supported
	var isContentEditable = 'isContentEditable' in document.createElement('span');

	$('#notes').prepend( new Note() );

	$('#new-note-button').on('click', function() {
		$('#notes').prepend( new Note() );
	});

	// load some recent notes
	$.get('/notes', function ( data ) {
		for (var i = 0; i < data.notes.length; ++i) {
			$('#notes').append( new Note(data.notes[i].title, null, data.notes[i].guid) );
		}
	}).then( function () {
		$('.note:not(.new-note)').each( function (index, element) {
			$.get('notes/' + $( element ).data('guid'), function ( note ) {
				$( element ).find('.content').append( note.content );
			});
		});
	});

	// Sync
	$('#sync-button').on('click', function () {
		$('.note.new-note').each( function (index, element) {
			var noteContent = {
				'title': $( element ).find('.title').val(),
				'content': $( element ).find('.content').html()
			};
			if (noteContent.title !== '' || noteContent.content !== '') {
				$.post('/createNote', noteContent, function ( response ) {
					$( element ).attr('data-guid', response.guid);
				});
				$( element ).removeClass('new-note').removeClass('changed');
				// Wrap content in <en-note></en-note> xml for Evernote
				var content = $( element ).find('.content');
				content.html('<en-note>' + content.html() + '</en-note>');
			}
		});

		$('.note.changed').each( function (index, element) {
			$.ajax('/updateNote', {
				type: 'PUT',
				dataType: 'json',
				data: {
					'guid': $(this).data('guid'),
					'title': $(this).find('.title').val(),
					'content': $(this).find('.content').html()
				},
				success: function ( response ) {
					console.log('' + response + ' updated note success');
				}
			});
			$(this).removeClass('changed');
		});
	});
});