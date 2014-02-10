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

var canvas;
var context;
var width;
var height;
var xBoard = 0;
var oBoard = 0;
var begin = true;

function drawBoard(){
    context.save();
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = 4;
    var vLine1 = Math.round(width/3);
    var vLine2 = Math.round(vLine1*2);
    var hLine1 = Math.round(height/3);
    var hLine2 = Math.round(hLine1*2);
    context.moveTo(vLine1, 0);
    context.lineTo(vLine1, height);
    context.moveTo(vLine2, 0);
    context.lineTo(vLine2, height);
    context.moveTo(0, hLine1);
    context.lineTo(width, hLine1);
    context.moveTo(0, hLine2);
    context.lineTo(width, hLine2);
    context.stroke();
    context.closePath();
    context.restore();
}

function init(canvasID){
    canvas = document.getElementById(canvasID);
    context = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    drawBoard();
}

function isEmpty(xBoard, yBoard, bit){
    return ((xBoard & bit) == 0) && ((yBoard & bit) == 0);
}

function drawX(x,y){
    context.save();
    context.beginPath();
    context.strokeStyle = '#ff0000';
    context.lineWidth = 4;
    var offsetX = (width/3) * 0.1;
    var offsetY = (height/3) * 0.1;
    var beginX = x * (width/3) + offsetX;
    var beginY = y * (height/3) + offsetY;
    var endX = (x+1) * (width/3) - offsetX;
    var endY = (y+1) * (height/3) - offsetY;
    context.moveTo(beginX, beginY);
    context.lineTo(endX, endY);
    context.moveTo(beginX, endY);
    context.lineTo(endX, beginY);
    context.closePath();
    context.stroke();
    context.restore();
}

init('game');
