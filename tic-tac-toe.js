var DEBUG = false;
var ACCELEROMETER = window.DeviceMotionEvent != null;

function randomNumber(max){
	return Math.floor(Math.random() * max + 1);
}

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
};
//returns true if the other entity collides with this one
PhysicalEntity.prototype.hits = function( anotherPhysicalEntity, stop){
    if((anotherPhysicalEntity.x - anotherPhysicalEntity.width/2) > (this.x - this.width/2)
        && (anotherPhysicalEntity.x - anotherPhysicalEntity.width/2) <= (this.x + this.width/2)){
        if((anotherPhysicalEntity.y - anotherPhysicalEntity.width/2) > (this.y - this.width/2)
            && (anotherPhysicalEntity.y - anotherPhysicalEntity.width/2) <= (this.y + this.width/2)){
            return true;
        } else if ((anotherPhysicalEntity.y + anotherPhysicalEntity.width/2) < (this.y + this.width/2)
            && (anotherPhysicalEntity.y + anotherPhysicalEntity.width/2) >= (this.y - this.width/2)){
            return true;
        }
    } else if ((anotherPhysicalEntity.x + anotherPhysicalEntity.width/2) < (this.x + this.width/2)
        && (anotherPhysicalEntity.x + anotherPhysicalEntity.width/2) >= (this.x - this.width/2)) {
        if((anotherPhysicalEntity.y - anotherPhysicalEntity.width/2) > (this.y - this.width/2)
            && (anotherPhysicalEntity.y - anotherPhysicalEntity.width/2) <= (this.y + this.width/2)){
            return true;
        } else if ((anotherPhysicalEntity.y + anotherPhysicalEntity.width/2) < (this.y + this.width/2)
            && (anotherPhysicalEntity.y + anotherPhysicalEntity.width/2) >= (this.y - this.width/2)){
            return true;
        }
    }
    if(!stop)
        return anotherPhysicalEntity.hits(this, true);
    return false;
};

//defines a spaceship
function Spaceship(){
	this.x = 100;
	this.y = 300;
	this.width = 50;
	this.height = 50;
	this.counter = 0;
    this.state = 'alive';
    this.bearing = 0;
    this.timeTillCooldown = -1;
};
Spaceship.inheritsFrom(PhysicalEntity);
//draw the Spaceship
Spaceship.prototype.draw = function(context){
	/*context.fillStyle = (this.state == 'alive' ? 'white' : 'purple');
	context.beginPath();
	context.moveTo( Math.floor(this.width)/2, 0);
	context.lineTo(this.width, this.height);
	context.lineTo(0, this.height);
	context.closePath();
	context.fill();*/
    if(this.state == 'alive'){ 
    	if(this.bearing == 0) context.drawImage(viewport.spaceship_image, 0, 0, this.width, this.height);
    	else if(this.bearing == 1) context.drawImage(viewport.spaceship_image_right, 0, 0, this.width, this.height);
    	else if(this.bearing == 3) context.drawImage(viewport.spaceship_image_left, 0, 0, this.width, this.height);
    }
    else if(this.state == 'hit'){ 
        context.fillStyle = 'blue';
        context.drawImage(viewport.spaceship_image_hit, 0, 0, this.width, this.height);
    }
	if(DEBUG) this.parent.draw.call(this, context);
};
//updates Spaceship
Spaceship.prototype.update = function() {
    //cool down laser gun
    if(this.timeTillCooldown >= 0){
        this.timeTillCooldown -= 1;    
    }
	//reset spaceship bearing
	this.bearing = 0;
    //stop spaceship from moving if it's not 'alive'
    if(this.state !== 'alive') return;
	//move left
	if(game.keyboard[37] || (ACCELEROMETER && game.keyboard.tiltLR > 0)){
		this.x -= ACCELEROMETER ? Math.floor(10 * Math.abs(game.keyboard.tiltLR)): 10;
		if(this.x - Math.floor(this.width/2) < 0){
			this.x = Math.floor(this.width/2);
		}
		this.bearing = 3;
	}
	//move right
	if(game.keyboard[39] || (ACCELEROMETER && game.keyboard.tiltLR < 0)){
		this.x += ACCELEROMETER ? Math.floor(10 * Math.abs(game.keyboard.tiltLR)): 10;
		if(this.x + Math.floor(this.width/2) > game.canvas.width){
			this.x = game.canvas.width - Math.floor(this.width/2);
		}
		this.bearing = 1;
	}
	//fire a laser
	if(game.keyboard[32] || (ACCELEROMETER && game.keyboard.tiltFB < 0)){
		if(! game.keyboard.fired){
			this.fireLaser();
			game.keyboard.fired = true;
		}else{
			game.keyboard.fired = false;
		}
	}
	if(DEBUG) this.parent.update.call(this);
};
//fire a Laser
Spaceship.prototype.fireLaser = function() {
    //don't fire if gun has yet to cooldown
    if(this.timeTillCooldown >= 0){
        return;    
    }
	var laser = new Laser();
	laser.x = this.x;
	laser.y = this.y - Math.floor(this.height/2);
	laser.state = 'hit';
    //start laser gun cooldown
    this.timeTillCooldown = 110;
    //shoot!
	game.lasers.push(laser);
};

//define a laser
function Laser(){
	this.width = 10;
	this.height = 30;
	this.state = 'clear';
	this.counter = 0;
};
Laser.inheritsFrom(PhysicalEntity);
//draw a Laser
Laser.prototype.draw = function(context){
	/*context.fillStyle = (this.state == 'clear' ? 'white' : 'blue');
	context.fillRect(0, 0, this.width, this.height);*/
    if(this.state === 'clear') context.drawImage(viewport.laser_image, 0, 0, this.width, this.height);
    else if (this.state === 'hit') context.drawImage(viewport.laser_image_hit, 0, 0, this.width, this.height);
};
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
	this.resetCounter();
};
//reset laser state
Laser.prototype.resetCounter = function(){
	if(this.state == 'hit'){
		this.counter++;
		if(this.counter >= 20){
			this.state = 'clear';
			this.counter = 0;
		}
	}
}

//define a missile
function Missile(){
	this.width = 10;
	this.height = 33;
	this.state = 'clear';
	this.counter = 0;
};
Missile.inheritsFrom(Laser);
//override update
Missile.prototype.update = function() {
	this.y += 2;
	if(this.hits(game.spaceship)){
		this.state = 'hit';
		game.spaceship.state = 'hit';
	}
	this.resetCounter();
};
//override draw
Missile.prototype.draw = function(context){
	/*context.fillStyle = (this.state == 'clear' ? 'yellow' : 'orange');
	context.fillRect(0,0,this.width,this.height);*/
    if(this.state === 'clear') context.drawImage(viewport.missile_image, 0, 0, this.width, this.height);
    else if (this.state === 'hit') context.drawImage(viewport.missile_image_hit, 0, 0, this.width, this.height);
    //else context.drawImage(viewport.missile_image, 0, 0, this.width, this.height);
};

//define a space invader
function Invader(){
	this.width = 40;
	this.height = 40;
	this.phase = Math.floor(Math.random() * 50);
	this.counter = 0;
	this.state = 'alive';
};
Invader.inheritsFrom(PhysicalEntity);
//draw an invader
Invader.prototype.draw = function(context){
	/*context.fillStyle = this.state == 'hit'? 'purple' : 'red';
	context.fillRect(0,0,this.width,this.height);*/
    if(this.state === 'alive') context.drawImage(viewport.invader_image, 0, 0, this.width, this.height);
    else if(this.state === 'hit'){ 
        context.fillStyle = 'purple';
        context.drawImage(viewport.invader_image_hit, 0, 0, this.width, this.height);
    }
    //else context.drawImage(viewport.invader_image, 0, 0, this.width, this.height);
};
//update an invader
Invader.prototype.update = function(){
	if(this.state == 'alive'){
		this.counter++;
	}
	//swing right and left 3 pixels
	this.x += Math.sin( this.counter * Math.PI * 2 / 100) * 3;
	if( (this.counter + this.phase) % 200 === 0){
		this.fireMissile();
	}
	if(this.state == 'hit'){
		this.counter++;
		if(this.counter >= 20){
			this.state = 'dead';
			this.counter = 0;
		}
	}
};
//fire missiles
Invader.prototype.fireMissile = function (){
	var missile = new Missile();
	missile.x = this.x;
	missile.y = this.y;
	missile.state = 'hit';
    missile.x += + (randomNumber(2) == 2 ? Math.floor(this.width/2) : -Math.floor(this.width/2) );
	game.missiles.push(missile);
};

//defines a message that is displayed on screen
function OnScreenMessage(titleFontSize, bodyFontSize){
    if(!titleFontSize) titleFontSize = 40;
    if(!bodyFontSize) bodyFontSize = 14;
    this.x = 0;
    this.y = 0;
    this.counter = -1;
    this.title = 'title';
    this.body = 'body';
    this.alpha = 0.5;
    this.titleFontSizePx = titleFontSize;
    this.bodyFontSizePx = bodyFontSize;
    this.titleFont = 'Bold ' + titleFontSize + 'px Helvetica, Arial';
    this.bodyFont = bodyFontSize +'px Helvetica, Arial';
    this.titleFillStyle = 'white';
    this.bodyFillStyle = 'white';
};
//draw a string on screen using context setup
OnScreenMessage.prototype.drawText = function(context, text, fontSizePx){
    var text2Draw = text.split('\n');
    this.counter += 1;
    this.alpha = this.counter/50.0;
    if(this.alalpha>1) this.alpha = 1;
    context.globalAlpha = this.alpha;
    for(var i = 0; i < text2Draw.length; i++){
        context.translate(0, fontSizePx * i);
        context.fillText(text2Draw[i], (game.canvas.width - context.measureText(text2Draw[i]).width)/2, 0);
    }
};
//draw message on screen
OnScreenMessage.prototype.paint = function(context){
    context.save();
    context.fillStyle = this.titleFillStyle;
    context.font = this.titleFont;
    context.translate(0, this.titleFontSizePx);
    this.drawText(context, this.title, this.titleFontSizePx);
    context.font = this.bodyFont;
    context.fillStyle = this.bodyFillStyle;
    context.translate(0, this.bodyFontSizePx);
    this.drawText(context, this.body, this.bodyFontSizePx);
    context.restore();
};

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
    //on screen message
    message: new OnScreenMessage(40,14),
	//execute update and drawing operations
	gameLoop: function(){
        //update game state
        game.update();
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
        //if there's a message, display it
        if(game.message.counter >=0) game.message.paint(game.context);
	},
    //update game state
    update: function(){
        if(game.spaceship.state === 'hit' && game.state === 'playing'){
            game.state = 'over';
            game.message.title = "\n\nGame Over";
            game.message.body = '\npress spacebar or tilt your phone\nforward to play again!\nTilt sideways to move spaceship while playing';
            game.message.counter = 0;
        }
        
        else if(game.state === 'over' && (game.keyboard[32] || (ACCELEROMETER && game.keyboard.tiltFB < 0))){
            game.message.counter = -1;
            viewport.startGame();    
        }
        
        else if(game.state === 'playing' && game.invaders.length === 0){
            game.state = 'won';
            game.message.title = "\n\nInvaders exterminated";
            game.message.body = '\npress spacebar or tilt your phone\nforward to play again!\nTilt sideways to move spaceship while playing';
            game.message.counter = 0;
        }
        
        else if(game.state === 'won' && (game.keyboard[32] || (ACCELEROMETER && game.keyboard.tiltFB < 0))){
            game.message.counter = -1;
            viewport.startGame();
        }
    },
	//a handle to stop game execution
	gameLoopHandle: null,
};

var viewport = {
    spaceship_image: null,
    spaceship_image_hit: null,
    spaceship_image_left: null,
    spaceship_image_right: null,
    invader_image: null,
    invader_image_hit: null,
    laser_image: null,
    laser_image_hit: null,
    missile_image: null,
    missile_image_hit: null,
    background_image: null,
	//fills the background with black
	clearBackground: function(){
		game.context.drawImage(viewport.background_image, 0, 0, game.canvas.width, game.canvas.height);
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
		var i;
        for(i = 0; i < game.lasers.length; i++){
			game.lasers[i].paint(game.context);
		}
		for(i = 0; i < game.missiles.length; i++){
			game.missiles[i].paint(game.context);
		}
	},
	//updates the lasers
	updateShots: function(){
        var i;
		for(i = 0; i < game.lasers.length; i++){
			game.lasers[i].update();
		}
		for(i = 0; i < game.missiles.length; i++){
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
        //clear remaining invaders
		game.invaders = [];
        //reset game state
        game.state = 'playing';
        //reset spaceship state
        game.spaceship.state = 'alive';
        //create invaders
        viewport.populateInvaderRow(0);
	},
	//create a line of invaders
	populateInvaderRow: function(rowNumber){
		if(!rowNumber || rowNumber === null){
			rowNumber = 0;
		}
		for(var i = 0; i < 10; i++){
			var invader = new Invader();
			invader.x = (rowNumber % 2 === 0 ? 30 : 40) + ( i * 50);
			invader.y = 30 + (rowNumber * 50);
			invader.counter = rowNumber % 2 === 0 ? 0 : 90;
			game.invaders.push(invader);
		}
	},
    //handle keydown events
    onKeyDown: function(e){
        game.keyboard[e.keyCode] = true;
    },
    //handle keyup events
    onKeyup: function(e) {
        game.keyboard[e.keyCode] = false;
    },
    //handle device motion events
    onDeviceMoved: function(e){
        //inhibit default behavior
        e.preventDefault();
        //calculate device state
        game.keyboard.acceleration = e.accelerationIncludingGravity;
		game.keyboard.facingUp = -1;
		if (game.keyboard.acceleration.z > 0) {
			game.keyboard.facingUp = +1;
		}
        //save device state
        //0 degrees means the device is leveled
        //a positive angle follows counter clockwise movement (tilt left)
        //40 degrees is max allowed right-left tilt
		game.keyboard.tiltLR = Math.round(((game.keyboard.acceleration.x) / 9.81) * -90)/40; 
		//0 degrees is portrait mode, while -180 means device is upside down
        // -90 degrees marks the 'belly up' position. This angle will be negative as long the device is still facing upwards
        // 30 degrees is the max allowed forth-back tilt
        game.keyboard.tiltFB = Math.round(((game.keyboard.acceleration.y + 9.81) / 9.81) * 90 * game.keyboard.facingUp);
        if(game.keyboard.tiltFB < -90){ // closer to -180 means device is going upside down
            game.keyboard.tiltFB = game.keyboard.tiltFB/120; // -30 away from -90 degrees is maximum allowed forwards tilt
        }else if (game.keyboard.tiltFB > -90){ // closer to 0 means device is going into portrait mode
            game.keyboard.tiltFB = Math.abs(game.keyboard.tiltFB+90)/60; // 30 away from -90 degrees is maximum allowed backwards tilt
        }
    },
	//registers keyboard events
	addKeyboardEvents: function() {
		addEvent(document, 'keydown', function(e){
			viewport.onKeyDown(e);
		}, true);
		addEvent(document, 'keyup', function(e){
			viewport.onKeyup(e);
		}, true);
        if(ACCELEROMETER){
            window.addEventListener('devicemotion',viewport.onDeviceMoved,true);    
        }
	},
    //draw messages on the screen
    drawMessages: function(){
        
    },
    //load media assets
    loadResources: function(){
        //load background image
        viewport.background_image = new Image();
        viewport.background_image.src = 'images/background-01.png';
        //load spaceship-still image
        viewport.spaceship_image = new Image();
        viewport.spaceship_image.src = 'images/spaceship-01.png';
        //load spaceship-hit image
        viewport.spaceship_image_hit = new Image();
        viewport.spaceship_image_hit.src = 'images/spaceship-hit-01.png';
        //load spaceship-left image
        viewport.spaceship_image_left = new Image();
        viewport.spaceship_image_left.src = 'images/spaceship-left-01.png';
        //load spaceship-right image
        viewport.spaceship_image_right = new Image();
        viewport.spaceship_image_right.src = 'images/spaceship-right-01.png';
        //load laser image
        viewport.laser_image = new Image();
        viewport.laser_image.src = 'images/laser-01.png';
        //load laser hit image
        viewport.laser_image_hit = new Image();
        viewport.laser_image_hit.src = 'images/laser-xplode-01.png';
        //load invader image
        viewport.invader_image = new Image();
        viewport.invader_image.src = 'images/invader-01.png';
        //load invader hit image
        viewport.invader_image_hit = new Image();
        viewport.invader_image_hit.src = 'images/invader-01.png';
        //load missile image
        viewport.missile_image = new Image();
        viewport.missile_image.src = 'images/missile-01.png';
        //load missile hit image
        viewport.missile_image_hit = new Image();
        viewport.missile_image_hit.src = 'images/missile-xplode-01.png';
    },
};

//setup game controls
viewport.addKeyboardEvents();
//initialize game content
viewport.loadResources();
viewport.startGame();
//make sure game loop gets run at a 60pfs rate
game.gameLoopHandle = setInterval(game.gameLoop, 1000/game.gameSpeed);
