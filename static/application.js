/* global $, hljs, window, document */

/**
 * represents a single document
 */
class haste_document {
	constructor(app) {
		this.locked = false;
		this.app = app;
	}

	// Escapes HTML tag characters
	htmlEscape(s) {
		return s.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	}

	// Get this document from the server and lock it here
	load(key, callback, lang) {
		$.ajax(this.app.baseUrl + 'documents/' + key, {
			type: 'get',
			dataType: 'json',
			success: res => {
				this.locked = true;
				this.key = key;
				this.data = res.data;
				try {
					var high;
					if (lang === 'txt') {
						high = { value: this.htmlEscape(res.data) };
					} else if (lang) {
						high = hljs.highlight(res.data, { language: lang });
					} else {
						high = hljs.highlightAuto(res.data);
					}
				} catch (err) {
					// failed highlight, fall back on auto
					high = hljs.highlightAuto(res.data);
				}
				callback({
					value: high.value,
					key: key,
					language: high.language || lang,
					lineCount: res.data.split('\n').length
				});
			},
			error: () => {
				callback(false);
			}
		});
	}

	// Save this document to the server and lock it here
	save(data, callback) {
		if (this.locked) {
			return false;
		}
		this.data = data;
		$.ajax(this.app.baseUrl + 'documents', {
			type: 'post',
			data: data,
			dataType: 'json',
			contentType: 'text/plain; charset=utf-8',
			success: res => {
				this.locked = true;
				this.key = res.key;
				const high = hljs.highlightAuto(data);
				callback(null, {
					value: high.value,
					key: res.key,
					language: high.language,
					lineCount: data.split('\n').length
				});
			},
			error: res => {
				try {
					callback($.parseJSON(res.responseText));
				} catch (e) {
					callback({ message: 'Something went wrong!' });
				}
			}
		});
	}
}

/**
 * represents the paste application
 */
class haste {
	// Map of common extensions
	// Note: this list does not need to include anything that IS its extension,
	// due to the behavior of lookupTypeByExtension and lookupExtensionByType
	// Note: optimized for lookupTypeByExtension
	static extensionMap = {
		rb: 'ruby',
		py: 'python',
		pl: 'perl',
		php: 'php',
		scala: 'scala',
		go: 'go',
		xml: 'xml',
		html: 'xml',
		htm: 'xml',
		css: 'css',
		js: 'javascript',
		vbs: 'vbscript',
		lua: 'lua',
		pas: 'delphi',
		java: 'java',
		cpp: 'cpp',
		cc: 'cpp',
		m: 'objectivec',
		vala: 'vala',
		sql: 'sql',
		sm: 'smalltalk',
		lisp: 'lisp',
		ini: 'ini',
		diff: 'diff',
		bash: 'bash',
		sh: 'bash',
		tex: 'tex',
		erl: 'erlang',
		hs: 'haskell',
		md: 'markdown',
		txt: '',
		coffee: 'coffee',
		swift: 'swift'
	};

	constructor(appName, options) {
		this.appName = appName;
		this.$textarea = $('textarea');
		this.$box = $('#box');
		this.$code = $('#box code');
		this.$linenos = $('#linenos');
		this.options = options;
		this.configureShortcuts();
		this.configureButtons();
		// If twitter is disabled, hide the button
		if (!options.twitter) {
			$('#box2 .twitter').hide();
		}
		this.baseUrl = options.baseUrl || '/';
	}

	// Set the page title - include the appName
	setTitle(ext) {
		const title = ext ? this.appName + ' - ' + ext : this.appName;
		document.title = title;
	}

	// Show a message box
	showMessage(msg, cls) {
		const msgBox = $('<li class="' + (cls || 'info') + '">' + msg + '</li>');
		$('#messages').prepend(msgBox);
		setTimeout(() => {
			msgBox.slideUp('fast', function () {
				$(this).remove();
			});
		}, 3000);
	}

	// Show the light key
	lightKey() {
		this.configureKey(['new', 'save']);
	}

	// Show the full key
	fullKey() {
		this.configureKey(['new', 'duplicate', 'twitter', 'raw']);
	}

	// Set the key up for certain things to be enabled
	configureKey(enable) {
		let $this,
			i = 0;
		$('#box2 .function').each(function () {
			$this = $(this);
			for (i = 0; i < enable.length; i++) {
				if ($this.hasClass(enable[i])) {
					$this.addClass('enabled');
					return true;
				}
			}
			$this.removeClass('enabled');
		});
	}

	// Remove the current document (if there is one)
	// and set up for a new one
	newDocument(hideHistory) {
		this.$box.hide();
		this.doc = new haste_document(this);
		if (!hideHistory) {
			window.history.pushState(null, this.appName, this.baseUrl);
		}
		this.setTitle();
		this.lightKey();
		this.$textarea.val('').show('fast', function () {
			this.focus();
		});
		this.removeLineNumbers();
	}

	// Look up the extension preferred for a type
	// If not found, return the type itself - which we'll place as the extension
	lookupExtensionByType(type) {
		for (let key in haste.extensionMap) {
			if (haste.extensionMap[key] === type) return key;
		}
		return type;
	}

	// Look up the type for a given extension
	// If not found, return the extension - which we'll attempt to use as the type
	lookupTypeByExtension(ext) {
		return haste.extensionMap[ext] || ext;
	}

	// Add line numbers to the document
	// For the specified number of lines
	addLineNumbers(lineCount) {
		let h = '';
		for (let i = 0; i < lineCount; i++) {
			h += (i + 1).toString() + '<br/>';
		}
		$('#linenos').html(h);
	}

	// Remove the line numbers
	removeLineNumbers() {
		$('#linenos').html('&gt;');
	}

	// Load a document and show it
	loadDocument(key) {
		// Split the key up
		const parts = key.split('.', 2);
		// Ask for what we want
		this.doc = new haste_document(this);
		this.doc.load(
			parts[0],
			ret => {
				if (ret) {
					this.$code.html(ret.value);
					this.setTitle(ret.key);
					this.fullKey();
					this.$textarea.val('').hide();
					this.$box.show().focus();
					this.addLineNumbers(ret.lineCount);
				} else {
					this.newDocument();
				}
			},
			this.lookupTypeByExtension(parts[1])
		);
	}

	// Duplicate the current document - only if locked
	duplicateDocument() {
		if (this.doc.locked) {
			const currentData = this.doc.data;
			this.newDocument();
			this.$textarea.val(currentData);
		}
	}

	// Lock the current document
	lockDocument() {
		this.doc.save(this.$textarea.val(), (err, ret) => {
			if (err) {
				this.showMessage(err.message, 'error');
			} else if (ret) {
				this.$code.html(ret.value);
				this.setTitle(ret.key);
				let file = this.baseUrl + ret.key;
				if (ret.language) {
					file += '.' + this.lookupExtensionByType(ret.language);
				}
				window.history.pushState(null, this.appName + '-' + ret.key, file);
				this.fullKey();
				this.$textarea.val('').hide();
				this.$box.show().focus();
				this.addLineNumbers(ret.lineCount);
			}
		});
	}

	configureButtons() {
		this.buttons = [
			{
				$where: $('#box2 .save'),
				label: 'Save',
				shortcutDescription: 'control + s',
				shortcut: evt => evt.ctrlKey && evt.keyCode === 83,
				action: () => {
					if (this.$textarea.val().replace(/^\s+|\s+$/g, '') !== '') {
						this.lockDocument();
					}
				}
			},
			{
				$where: $('#box2 .new'),
				label: 'New',
				shortcut: evt => evt.ctrlKey && evt.keyCode === 78,
				shortcutDescription: 'control + n',
				action: () => {
					this.newDocument(!this.doc.key);
				}
			},
			{
				$where: $('#box2 .duplicate'),
				label: 'Duplicate & Edit',
				shortcut: evt => this.doc.locked && evt.ctrlKey && evt.keyCode === 68,
				shortcutDescription: 'control + d',
				action: () => {
					this.duplicateDocument();
				}
			},
			{
				$where: $('#box2 .raw'),
				label: 'Just Text',
				shortcut: evt => evt.ctrlKey && evt.shiftKey && evt.keyCode === 82,
				shortcutDescription: 'control + shift + r',
				action: () => {
					window.location.href = this.baseUrl + 'raw/' + this.doc.key;
				}
			},
			{
				$where: $('#box2 .twitter'),
				label: 'Twitter',
				shortcut: evt => this.options.twitter && this.doc.locked && evt.shiftKey && evt.ctrlKey && evt.keyCode == 84,
				shortcutDescription: 'control + shift + t',
				action: () => {
					window.open('https://twitter.com/share?url=' + encodeURI(window.location.href));
				}
			}
		];
		for (let i = 0; i < this.buttons.length; i++) {
			this.configureButton(this.buttons[i]);
		}
	}

	configureButton(options) {
		// Handle the click action
		options.$where.click(function (evt) {
			evt.preventDefault();
			if (!options.clickDisabled && $(this).hasClass('enabled')) {
				options.action();
			}
		});
		// Show the label
		options.$where.mouseenter(function () {
			$('#box3 .label').text(options.label);
			$('#box3 .shortcut').text(options.shortcutDescription || '');
			$('#box3').show();
			$(this).append($('#pointer').remove().show());
		});
		// Hide the label
		options.$where.mouseleave(function () {
			$('#box3').hide();
			$('#pointer').hide();
		});
	}

	// Configure keyboard shortcuts for the textarea
	configureShortcuts() {
		$(document.body).keydown(evt => {
			for (let i = 0; i < this.buttons.length; i++) {
				const button = this.buttons[i];
				if (button.shortcut && button.shortcut(evt)) {
					evt.preventDefault();
					button.action();
					return;
				}
			}
		});
	}
}

///// Tab behavior in the textarea - 2 spaces per tab
$(function () {
	$('textarea').keydown(function (evt) {
		if (evt.keyCode === 9) {
			evt.preventDefault();
			const myValue = '  ';
			// http://stackoverflow.com/questions/946534/insert-text-into-textarea-with-jquery
			// For browsers like Internet Explorer
			if (document.selection) {
				this.focus();
				const sel = document.selection.createRange();
				sel.text = myValue;
				this.focus();
			}
			// Mozilla and Webkit
			else if (this.selectionStart || this.selectionStart == '0') {
				const startPos = this.selectionStart;
				const endPos = this.selectionEnd;
				const scrollTop = this.scrollTop;
				this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
				this.focus();
				this.selectionStart = startPos + myValue.length;
				this.selectionEnd = startPos + myValue.length;
				this.scrollTop = scrollTop;
			} else {
				this.value += myValue;
				this.focus();
			}
		}
	});
});
