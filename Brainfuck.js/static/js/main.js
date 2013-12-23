'use strict';

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

var DoubleLinkedList = function() {
	this._ptr = null;
	this._start = null;
	this._end = null;

	this.Element = function(data, next, prev) {
		this._data = data;
		this._next = next;
		this._prev = prev;
	};

	var e = new this.Element();
};

DoubleLinkedList.prototype = {
	isEmpty: function() {
		return !this._ptr;
	},
	isEnd: function() {
		if (this.isEmpty()) {
			return true;
		}

		return !this._ptr._next;
	},
	isStart: function() {
		if (this.isEmpty()) {
			return true;
		}

		return !this._ptr._prev;
	},
	append: function(data) {
		if (this.isEmpty()) {
			this._ptr = new this.Element(data);
			this._start = this._ptr;
			this._end = this._ptr;
			return true;
		}

		var newEl = new this.Element(data, this._ptr._next, this._ptr);

		if (!this.isEnd()) {
			this._ptr._next._prev = newEl;
		}

		this._ptr._next = newEl;
	},
	prepend: function(data) {
		if (this.isEmpty()) {
			this._ptr = new this.Element(data);
			this._start = this._ptr;
			this._end = this._ptr;
			return true;
		}

		var newEl = new this.Element(data, this._ptr, this._ptr._prev);

		if (!this.isStart()) {
			this._ptr._prev._next = newEl;
		}

		this._ptr._prev = newEl;
	},
	next: function() {
		if (this.isEnd()) {
			return false;
		}

		this._ptr = this._ptr._next;
	},
	prev: function() {
		if (this.isStart()) {
			console.log('this is start');
			return false;
		}

		this._ptr = this._ptr._prev;
	},
	get: function() {
		if (this.isEmpty()) {
			return false;
		}

		var result = this._ptr;
	},
	read: function() {
		if (this.isEmpty()) {
			return false;
		}

		return this._ptr._data;
	},
	update: function(data) {
		if (this.isEmpty()) {
			return false;
		}

		this._ptr._data = data;
	}
};


var Tape = function(selector, cells, withChars) {
	var self = this;	// remember the context

	this.cellHTML = '<div class="cell"></div>';
	this.node = $(selector);
	this.list = new DoubleLinkedList();
	this.pointer = $('.pointer');
	this.actions = [];
	this.code = '';
	this.currentChar = 0;
	this.isEnded = false;
	this.run = true;
	this.loopStartPoints = [];
	this.chars = withChars || false;

	this.node.width(0);
	this.appendCell();

	for (var i = 0; i < cells; i++) {
		this.prependCell();
		this.appendCell();
	}
	console.log(cells - Math.floor(this.fullCellsOnScreen() / 2));
	this.node.css('left', -(cells - Math.floor(this.fullCellsOnScreen() / 2)) * this.node.find('.cell').outerWidth(true) );
	this.pointer.css('left', (Math.floor(this.fullCellsOnScreen() / 2) * this.node.find('.cell').outerWidth(true) + this.pointer.outerWidth() + 1));

	this.term = $('#term').terminal(function(command, term) {
		if (isNumber(command)) {
			var listData = self.list.read();
			listData.data = command;
			listData.node.text(command);
			self.list.update(listData);
		}
		term.pause();
		term.disable();
		term.focus(false);
		self.readNextChar();
	}, {
		login: false,
		greetings: "[[b;#ddd;#1b1b1b]Welcome to Brainfuck.js console. Good luck!]",
		enabled: false
	});

	this.term.pause();

	this.actions['<'] = function() {
		self.moveLeft();
	};
	this.actions['>'] = function() {
		self.moveRight();
	};
	this.actions['+'] = function() {
		self.increaseValue();
	};
	this.actions['-'] = function() {
		self.decreaseValue();
	};
	this.actions['.'] = function() {
		self.printValue();
	};
	this.actions[','] = function() {
		self.scanValue();
	};
	this.actions['#'] = function() {
		self.breakPoint();
	};
	this.actions['['] = function() {
		self.startLoop();
	};
	this.actions[']'] = function() {
		self.endLoop();
	};

};

Tape.prototype = {
	fill: function(cells, withChars) {
		this.chars = withChars;
		this.node.width(0);
		this.appendCell();

		for (var i = 0; i < cells; i++) {
			this.prependCell();
			this.appendCell();
		}
		console.log(cells - Math.floor(this.fullCellsOnScreen() / 2));
		this.node.css('left', -(cells - Math.floor(this.fullCellsOnScreen() / 2)) * this.node.find('.cell').outerWidth(true) );
		this.pointer.css('left', (Math.floor(this.fullCellsOnScreen() / 2) * this.node.find('.cell').outerWidth(true) + this.pointer.outerWidth() + 1));
	},
	clear: function() {
		this.node.find('.cell').remove();
		this.node.removeAttr('style');
		this.list = new DoubleLinkedList();
	},
	switchChar: function() {
		var temp = this.list._ptr;

		this.list._ptr = this.list._start;

		while (!this.list.isEnd()) {
			var data = this.list._ptr._data;
			data.node.text(String.fromCharCode(data.data));
			this.list.next();
		}

		this.list._ptr = temp;
	},
	fullCellsOnScreen: function() {
		var cont = this.node.parent().outerWidth();
		var cell = this.node.find('.cell').outerWidth(true);
		console.log(cont);
		console.log(cell);
		return Math.floor(cont / cell);
	},
	isStart: function() {
		return parseInt(this.node.css('left'), 10) >= 0;
	},
	isEnd: function() {
		return false;
	},
	appendCell: function(data) {
		data = data || 0;

		var cell = $(this.cellHTML);

		if (this.chars) {
			cell.text(String.fromCharCode(data));
		} else {
			cell.text(data);
		}

		if (this.list.read()) {
			cell.insertAfter(this.list.read().node);
		} else {
			this.node.append(cell);
		}

		this.list.append({
			node: cell,
			data: data
		});

		this.node.width(function(index, width) {
			return width + $(this).find('.cell').outerWidth(true);
		});
	},
	prependCell: function(data) {
		data = data || 0;

		var cell = $(this.cellHTML);
		if (this.chars) {
			cell.text(String.fromCharCode(data));
		} else {
			cell.text(data);
		}

		cell.insertBefore(this.list.read().node);
		this.list.prepend({
			node: cell,
			data: data
		});

		this.node.width(function(index, width) {
			return width + $(this).find('.cell').outerWidth(true);
		});
	},
	moveRight: function() {
		var leftPos = parseInt(this.node.css('left'), 10);
		var cellWidth = this.node.find('.cell').outerWidth(true);
		this.node.css('left', leftPos - cellWidth);
		this.list.next();

		if (this.run) {
			this.readNextChar();
		}
	},
	moveLeft: function() {
		// if (this.isStart()) {
		// 	return false;
		// }
		var leftPos = parseInt(this.node.css('left'), 10);
		var cellWidth = this.node.find('.cell').outerWidth(true);
		this.node.css('left', leftPos + cellWidth);
		this.list.prev();

		if (this.run) {
			this.readNextChar();
		}
	},
	increaseValue: function() {
		var val = this.list.read();
		if (val.data >= 255) {
			return false;
		}

		val.data++;

		if (this.chars) {
			val.node.text(String.fromCharCode(val.data));
		} else {
			val.node.text(val.data);
		}

		if (this.run) {
			this.readNextChar();
		}
	},
	decreaseValue: function() {
		var val = this.list.read();
		if (val.data <= 0) {
			return false;
		}

		val.data--;

		if (this.chars) {
			val.node.text(String.fromCharCode(val.data));
		} else {
			val.node.text(val.data);
		}

		if (this.run) {
			this.readNextChar();
		}
	},
	printValue: function() {
		if (this.chars) {
			this.term.echo(String.fromCharCode(this.list.read().data));
		} else {
			this.term.echo(this.list.read().data);
		}

		this.term.pause();

		if (this.run) {
			this.readNextChar();
		}
	},
	scanValue: function() {
		this.term.resume();
		this.term.enable();
		this.term.focus();
	},
	startLoop: function() {
		var val = this.getValue();

		if (val && val != 0) {
			this.loopStartPoints.push(this.currentChar);
		} else {
			var cl = 1;
			while (cl) {
				this.currentChar++;

				if (this.code[this.currentChar] == '[') {
					cl++;
				}

				if (this.code[this.currentChar] == ']') {
					cl--;
				}
			}
			this.currentChar++;
		}

		if (this.run) {
			this.readNextChar();
		}
	},
	endLoop: function() {
		var pos = this.loopStartPoints.pop();
		var val = this.getValue();

		if (val && val != 0) {
			this.currentChar = pos;
			this.loopStartPoints.push(pos);
		}

		if (this.run) {
			this.readNextChar();
		}
	},
	breakPoint: function() {
		return false;
	},
	doAction: function(action) {
		if (this.actions[action]) {
			console.log('action:', action);
			var leftPart = this.code.slice(0, this.currentChar - 1);
			var rightPart = this.code.slice(this.currentChar);
			$('.code').html(leftPart + '<mark>' + this.code[this.currentChar - 1] + '</mark>' + rightPart);
			return this.actions[action]();
		}

		this.readNextChar();
	},
	getValue: function() {
		if (this.list.isEmpty()) {
			return false;
		}

		return this.list.read().data;
	},
	readNextChar: function() {
		if (this.currentChar >= this.code.length || this.isEnded) {
			this.term.echo('[[b;#00aa11;#1b1b1b]Success!]');
			this.stop();
			console.log('end');
			return;
		}

		this.doAction(this.code[this.currentChar++]);
	},
	execute: function(code, isRun) {
		this.term.clear();
		this.code = code;
		this.isEnded = false;
		this.currentChar = 0;
		this.run = isRun;

		$('.editor').hide();
		$('.code').text(code);
		$('.code').show();
		$('.run').hide();
		$('.debug').hide();
		$('.stop').show();

		$('.btn-default').attr('disabled', 'disabled');

		this.readNextChar();
	},
	stop: function() {
		this.code = '';
		this.currentChar = 0;
		this.isEnded = true;

		$('.code').hide();
		$('.editor').show();
		$('.stop').hide();
		$('.run').show();
		$('.debug').show();
		$('.btn-default').removeAttr('disabled');

		this.term.pause();
		console.log('stop');
		if (!this.run) {
			$('.next-step').hide(400);
		}
	}
};

// TODO
// - create temperature-sensetive cells
// - shield from HTML
// - highligth breakpoints

$(function() {
	var list = new DoubleLinkedList();
	var tape = new Tape('#tape', 100, false);
	// tape.fill(100, false);

	$('.run').on('click', function() {
		var code = $('.editor').val();
		tape.execute(code, true);

	});

	$('.stop').on('click', function() {
		tape.stop();
	});


	$('.debug').on('click', function() {
		var code = $('.editor').val();
		if (code.length) {
			$('.next-step').show(400);
		}

		tape.execute(code, false);
	});

	$('.next-step').on('click', function() {
		tape.readNextChar();
	});

	$('.reset').on('click', function() {
		var chars = tape.chars;
		tape.clear();
		tape.fill(100, chars);
	});

	$('.numbers').on('click', function() {
		$('.letters').removeClass('active');
		$(this).addClass('active');
		tape.clear();
		tape.fill(100, false);
	});

	$('.letters').on('click', function() {
		$('.numbers').removeClass('active');
		$(this).addClass('active');
		tape.clear();
		tape.fill(100, true);
	});




	$('.moveLeft').on('click', function() {
		tape.moveLeft();
	});
	$('.moveRight').on('click', function() {
		tape.moveRight();
	});
	$('.increaseValue').on('click', function() {
		tape.increaseValue();
	});
	$('.decreaseValue').on('click', function() {
		tape.decreaseValue();
	});
});
