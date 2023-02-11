var canvas, ctx, info;
var bg;
var hammer, hamX, hamY;
var mouseState, mouseFrmLen = 10, mousePress = false;
var sprites = [], holes = [];
var score = 0;
var Sprite = function(w, h, x, y, state, image){
	var self = this;
	this.w = w;
	this.h = h;
	this.x = x;
	this.y = y;
	this.image = image;
	this.state = state;
	
	this.draw = function(){
		if(this.state == 'show'){
			ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
			setTimeout(function(){
				self.state = 'hide';
			},3000);
		}
	}
}

var HoleSprite = function(w, h, x, y, state, image){
	var self = this;
	this.w = w;
	this.h = h;
	this.x = x;
	this.y = y;
	this.image = image;
	this.state = state;
	
	this.draw = function(){
		if(this.state == 'show'){
			ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
		}
	}
}

function HammerSprite(w, h, x, y, image){
	HammerSprite.prototype.w = w;
	HammerSprite.prototype.h = h;
	HammerSprite.prototype.x = x;
	HammerSprite.prototype.y = y;
	
	HammerSprite.prototype.draw = function(isPress){
		if(isPress){
			ctx.save();
			
			ctx.translate(this.x-10, this.y+34);
			ctx.rotate(Math.PI/180*330);
			ctx.drawImage(image, 0, 0, w, h);
			
			ctx.restore();
		}else{
			ctx.drawImage(image, this.x, this.y, w, h);
		}
		
	}
}

function clearScreen(){
	//ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawScreen(){
	clearScreen();
	
	//绘制得分
	
	ctx.font = "40px serif"
	ctx.strokeStyle = "#FF00ff";
	ctx.strokeText ("LION打地鼠", 50,50);
	ctx.fillStyle = "#000000";
	ctx.fillText("LION打地鼠",50,50);

	ctx.fillStyle = "#ff0000";
	ctx.fillText("你的得分:"+score,450,50);
	for(i=0;i<3;i++){
		for(j=0; j<3; j++){
			holes[i][j].draw();
		}
	}
	

	for(i=0;i<3;i++){
		for(j=0; j<3; j++){
			sprites[i][j].draw();
		}
	}
	
	if(hammer){
		hammer.draw(mousePress);
	}
}

function updateLogic(){

	for(i=0;i<3;i++){
		for(j=0; j<3; j++){
			sprites[i][j].state=='hide'
		}
	}
	
	var a = Math.round(Math.random()*100)%3;
	var b = Math.round(Math.random()*100)%3;
	sprites[a][b].state='show';
}


function hammerMove(e){
	if(hammer){
		hammer.x = event.x-40;
		hammer.y = event.y-40;
	}
}

function hit(x, y){
 	
	for(i=0;i<3;i++){
		for(j=0;j<3;j++){
			var s = sprites[i][j];
			
			if(s.state=='show'){
				if(x>s.x+30 && y>s.y && x<(s.x+s.w+30) && y<(s.y+s.h)){
					score++;
					s.state = 'hide';
				}
			}
		}
	}
}

function init(){
	info = document.getElementById('info');
	canvas = document.getElementById('screen');
	ctx = canvas.getContext('2d');
	
	bg = new Image();
	bg.src = 'bg.jpg';
	bg.onload = function(){};
	
	
	var hamImg = new Image();
	hamImg.src = 'hammer.png';
	hamImg.onload = function(){
		hammer = new HammerSprite(48, 48, 100, 100, hamImg);
	}
	
	var msImg = new Image();
	msImg.src = 'mouse.png';
	
	msImg.onload = function(){
		for(i=0;i<3;i++){
			var arr = [];
			for(j=0; j<3; j++){
				var s = new Sprite(60, 70, 50+240*i, 80+120*j, 'hide', msImg); 
				arr[j] = s;
			}
			sprites[i] = arr;
		}		
	}
	
	var holeImg = new Image();
	holeImg.src = 'hole.png';
	holeImg.onload = function(){
		for(i=0;i<3;i++){
			var arr = [];
			for(j=0; j<3; j++){
				var s = new HoleSprite(80, 30, 40+240*i, 140+120*j, 'show', holeImg); 
				arr[j] = s;
			}
			holes[i] = arr;
		}		
	}
	
	setInterval(drawScreen, 30);
	setInterval(updateLogic, 3000);
	
};

function hammerDown(){
	mousePress = true;
}

function hammerUp(){

	info.innerHTML=event.x+':'+event.y;
	mousePress = false;
	hit(event.x, event.y);
}

function hideCursor(obj){
	obj.style.cursor='none';
}

function showCursor(obj){
	obj.style.cursor='';
}