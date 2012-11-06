var DEBUG = false;

//setup class inheritance
Function.prototype.inheritsFrom = function( superClass ){
	this.prototype = new superClass;
	this.prototype.constructor = this;
	this.prototype.parent = superClass.prototype; // use this.parent.methodName.call(this[, arg]*) to call a method from the superclass
}

//x-browser event helper
function addEvent(node, name, func, supressDefault) {
	if(node.addEventListener){
		node.addEventListener(name, func, supressDefault);
	}else if(node.attachEvent) {
		node.attachEvent(name, func);
	}
}

//defines a physical entity
function PhysicalEntity(){
	//entity's mass center coordinates
	this.x = 0;
	this.y = 0;
	//entity dimensions
	this.width = 0;
	this.height = 0;
}
//update entity status
PhysicalEntity.prototype.update = function(){
	if(DEBUG) console.log('updating: ' + this.constructor.name + '[width:' + this.width + ' height:' + this.height + '] at <' + this.x + ',' + this.y + '>');
};
//translates drawing context so that the space-box alloted for the entity's dimensions is centered on the entity's center of mass
PhysicalEntity.prototype.paint = function(context){
	context.save();
	context.translate( this.x - Math.floor(this.width/2), this.y - Math.floor(this.height/2) );
	this.draw(context);
	context.restore();
};
//draws the entity on screen
PhysicalEntity.prototype.draw = function(context){
	if(DEBUG) console.log('drawing: ' + this.constructor.name + '[width:' + this.width + ' height:' + this.height + '] at <' + this.x + ',' + this.y + '>');
}
//returns true if the other entity collides with this one
PhysicalEntity.prototype.hits = function( anotherPhysicalEntity ){
	var distance = Math.sqrt( Math.pow(this.x - anotherPhysicalEntity.x, 2) + Math.pow(this.y - anotherPhysicalEntity.y, 2) );
	return (distance <= this.width/2 && distance <= this.height/2) 
			|| (distance <= anotherPhysicalEntity.width/2 && distance <= anotherPhysicalEntity.height/2);
}

//defines a spaceship
function Spaceship(){
	this.x = 100;
	this.y = 300;
	this.width = 50;
	this.height = 50;
	this.counter = 0;
}
Spaceship.inheritsFrom(PhysicalEntity);
//draw the Spaceship
Spaceship.prototype.draw = function(context){
	context.fillStyle = '#FFFFFF';
	context.beginPath();
	context.moveTo( Math.floor(this.width)/2, 0);
	context.lineTo(this.width, this.height);
	context.lineTo(0, this.height);
	context.closePath();
	context.fill();
	if(DEBUG) this.parent.draw.call(this, context);
}
//updates Spaceship
Spaceship.prototype.update = function() {
	//move left
	if(game.keyboard[37]){
		this.x -= 10;
		if(this.x - Math.floor(this.width/2) < 0){
			this.x = Math.floor(this.width/2);
		}
	}
	//move right
	if(game.keyboard[39]){
		this.x += 10;
		if(this.x + Math.floor(this.width/2) > game.canvas.width){
			this.x = game.canvas.width - Math.floor(this.width/2);
		}
	}
	//fire a laser
	if(game.keyboard[32]){
		if(! game.keyboard.fired){
			this.fireLaser();
			game.keyboard.fired = true;
		}else{
			game.keyboard.fired = false;
		}
	}
	if(DEBUG) this.parent.update.call(this);
}
//fire a Laser
Spaceship.prototype.fireLaser = function() {
	var laser = new Laser();
	laser.x = this.x;
	laser.y = this.y - Math.floor(this.height/2);
	game.lasers.push(laser);
}

//define a laser
function Laser(){
	this.width = 10;
	this.height = 30;
	this.state = 'clear';
}
Laser.inheritsFrom(PhysicalEntity);
//draw a Laser
Laser.prototype.draw = function(context){
	context.fillStyle = 'white';
	context.fillRect(0, 0, this.width, this.height);
}
//update a laser
Laser.prototype.update = function(){
	this.y -= 2;
	for(var i = 0; i < game.invaders.length; i++){
		if(this.hits(game.invaders[i])){
			this.state = 'hit';
			game.invaders[i].state = 'hit';
			game.invaders[i].counter = 0;
		}
	}
}

//define a missile
function Missile(){
	this.width = 10;
	this.height = 33;
	this.state = 'clear';
}
Missile.inheritsFrom(Laser);
//override update
Missile.prototype.update = function() {
	this.y += 2;
	if(this.hits(game.spaceship)){
		this.state = 'hit';
		game.spaceship.state = 'hit';
	}
}
//override draw
Missile.prototype.draw = function(context){
	context.fillStyle = 'yellow';
	context.fillRect(0,0,this.width,this.height);
}

//define a space invader
function Invader(){
	this.width = 40;
	this.height = 40;
	this.phase = Math.floor(Math.random() * 50);
	this.counter = 0;
	this.state = 'alive';
}
Invader.inheritsFrom(PhysicalEntity);
//draw an invader
Invader.prototype.draw = function(context){
	context.fillStyle = this.state == 'hit'? 'purple' : 'red';
	context.fillRect(0,0,this.width,this.height);
}
//update an invader
Invader.prototype.update = function(){
	if(this.state == 'alive'){
		this.counter++;
	}
	//swing right and left 3 pixels
	this.x += Math.sin( this.counter * Math.PI * 2 / 100) * 3;
	if( (this.counter + this.phase) % 200 == 0){
		this.fireMissile();
	}
	if(this.state == 'hit'){
		this.counter++;
		if(this.counter >= 20){
			this.state = 'dead';
			this.counter = 0;
		}
	}
}
//fire missiles
Invader.prototype.fireMissile = function (){
	var missile = new Missile();
	missile.x = this.x;
	missile.y = this.y;
	game.missiles.push(missile);
}

var game = {
	//keep track of game state
	state: 'start',
	//game speed as fps
	gameSpeed: 60,
	//reference to the canvas html element
	canvas: document.getElementById('game'),
	//reference for html's 2d graphics context
	context: document.getElementById('game').getContext('2d'),
	//keyboard state
	keyboard: {},
	//the fired lasers
	lasers: [],
	//the space invaders
	invaders: [],
	//the invader's missiles
	missiles: [],
	//the game's spaceship
	spaceship: new Spaceship(),
	//execute update and drawing operations
	gameLoop: function(){
		//update the spaceship
		viewport.updateSpaceship();
		//update fired lasers
		viewport.updateShots();
		//update invaders
		viewport.updateInvaders();
		//clear the background before drawing game state on screen
		viewport.clearBackground();
		//draw the spaceship
		viewport.paintSpaceship();
		//draw the lasers
		viewport.paintShots();
		//draw the invaders
		viewport.paintInvaders();
	},
	//a handle to stop game execution
	gameLoopHandle: null,
};

var viewport = {
	//fills the background with black
	clearBackground: function(){
		game.context.fillStyle = '#000000';
		game.context.fillRect(0,0,game.canvas.width,game.canvas.height);
	},
	//paints a spaceship
	paintSpaceship: function() {
		game.spaceship.paint(game.context);
	},
	//updates the spaceship
	updateSpaceship: function(){
		game.spaceship.update();
	},
	paintShots: function(){
		for(var i = 0; i < game.lasers.length; i++){
			game.lasers[i].paint(game.context);
		}
		for(var i = 0; i < game.missiles.length; i++){
			game.missiles[i].paint(game.context);
		}
	},
	//updates the lasers
	updateShots: function(){
		for(var i = 0; i < game.lasers.length; i++){
			game.lasers[i].update();
		}
		for(var i = 0; i < game.missiles.length; i++){
			game.missiles[i].update();
		}
		//remove lasers that are out of the viewport
		game.lasers = game.lasers.filter(function(laser){
			return laser.y > 0 && laser.y < game.canvas.height;
		});
		//remove missiles no longer within the viewport
		game.missiles = game.missiles.filter(function(missile){
			return missile.y > 0 && missile.y < game.canvas.height;
		});
	},
	//paint invaders
	paintInvaders: function(){
		for(var i =0; i < game.invaders.length; i++){
			game.invaders[i].paint(game.context);
		}
	},
	//update invaders
	updateInvaders: function(){
		for(var i =0; i < game.invaders.length; i++){
			game.invaders[i].update();
		}
		game.invaders = game.invaders.filter(function(invader){ return invader.state != 'dead'; });
	},
	//initializes game content
	startGame: function(){
		
	},
	//create a line of invaders
	populateInvaderRow: function(rowNumber){
		if(!rowNumber || rowNumber == null){
			rowNumber = 0;
		}
		for(var i = 0; i < 10; i++){
			var invader = new Invader();
			invader.x = (rowNumber % 2 == 0 ? 30 : 40) + ( i * 50);
			invader.y = 30 + (rowNumber * 50);
			invader.counter = rowNumber % 2 == 0 ? 0 : 90;
			game.invaders.push(invader);
		}
	},
	//registers keyboard events
	addKeyboardEvents: function() {
		addEvent(document, 'keydown', function(e){
			game.keyboard[e.keyCode] = true;
		}, true);
		addEvent(document, 'keyup', function(e){
			game.keyboard[e.keyCode] = false;
		}, true);
	},
};

//setup game controls
viewport.addKeyboardEvents();
//initialize game content
viewport.startGame();
viewport.populateInvaderRow(0);
viewport.populateInvaderRow(1);
//make sure game loop gets run at a 60pfs rate
game.gameLoopHandle = setInterval(game.gameLoop, 1000/game.gameSpeed);
