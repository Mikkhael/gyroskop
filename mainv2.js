if(window.screen.lockOrientation)
    window.screen.lockOrientation("portrait");

var levelScale = 1;
(function(){
	let width = window.innerWidth - 20;
	let height = window.innerHeight - 20;
	
	let scaleW = width / 320;
	let scaleH = height / 430;
	
	levelScale = Math.min(scaleW, scaleH);
	
})();



var game = new Phaser.Game(320 * levelScale, 430 * levelScale, Phaser.AUTO, '', { preload: preload, create: create, update: update });



function preload() {

    game.stage.disableVisibilityChange = true;
	game.stage.backgroundColor = "#388bf0";
    
    game.load.json('levels', 'assets/levels/levels.json');
    game.load.image('lvl1bg', 'assets/levels/lvl1.png');
    game.load.image('lvl2bg', 'assets/levels/lvl2.png');
    game.load.image('lvl3bg', 'assets/levels/lvl3.png');
    game.load.image('ball', 'assets/ball.png');

}

var ballScale = 0.25;

var walls, wallsCollisionGroup;
var obstacles;

var ball, ballCollisionGroup;
var finish, finishCollisionGroup;
var background;
var levelsJson;

var graphics;

var gravityForce = 2000;


var timer;
var timePassed = 0;

function create() {
    
	game.physics.startSystem(Phaser.Physics.BOX2D);	
	game.physics.box2d.setBoundsToWorld(true, true, true, true);
    game.physics.box2d.gravity.y = 0;
    game.physics.box2d.gravity.x = 0;
	game.physics.box2d.restitution = 0.3;
	
    levelsJson = game.cache.getJSON('levels');
    
    walls = game.add.physicsGroup(Phaser.Physics.BOX2D);
    obstacles = game.add.physicsGroup(Phaser.Physics.BOX2D);
    
    ball = game.add.sprite(-100 * levelScale, -100 * levelScale, 'ball');
    ball.scale.setTo(ballScale * levelScale, ballScale * levelScale);
    game.physics.box2d.enable(ball);
    ball.body.setCircle(50 * ballScale * levelScale);
    ball.body.collideWorldBounds = true;
    ball.body.static = true;
    
    finish = game.add.sprite(0,0);
    game.physics.box2d.enable(finish);
    finish.body.static = true;
	finish.body.setBodyContactCallback(ball, nextLevelHandler, this);
    
	timer = game.time.create(false);
	timer.start();
   
    loadLevel(currentLevel);
    
}

function nextLevelHandler(){
	if(!window['levelComplete'] && !window['loadingLevel']){
		finish.body.setBodyContactCallback(ball, null);
		window['levelComplete'] = true;
		finishLevel();
	}
}

function update() {
    updateGravity();
	updateGravityDebug();
	if(!levelComplete && !loadingLevel){
		timePassed += timer.elapsed;
	}
}

var currentLevel = 0;
const levelsCount = 3;
var levelComplete = false;
let loadingLevel = false;

function loadLevel(num){
	currentLevel = num;
    let lvl = levelsJson[num];
    
	if(background)
		background.destroy();
    background = game.add.sprite(0,0,lvl.bg);
    background.scale.setTo(levelScale, levelScale);
	
	ball.body.setZeroVelocity();
    
    walls.removeAll(true);
    obstacles.removeAll(true);
    
    let polygons = lvl.walls.map( polygon => polygon.map(points => [levelScale * points[0] * 320 / 84.666664, levelScale * points[1] * 430 / 113.77084 ]));
    for(let polygon of polygons){
        let wall = walls.create(0,0);
        wall.body.addPolygon(polygon.reduce(function(prev, val){return prev.concat(val);}, []));
        wall.body.static = true;
    }
	let obstaclepolygons = lvl.obstacles.map( polygon => polygon.map(points => [levelScale * points[0] * 320 / 84.666664, levelScale * points[1] * 430 / 113.77084 ]));
    for(let polygon of obstaclepolygons){
        let obstacle = obstacles.create(0,0);
        obstacle.body.addPolygon(polygon.reduce(function(prev, val){return prev.concat(val);}, []));
        obstacle.body.static = true;
		obstacle.body.setBodyContactCallback(ball, function(notBody, body){
			setTimeout(function(){reset(body, lvl.start[0] * levelScale, lvl.start[1] * levelScale);},0);
		}, this);
    }
    
    finish.body.x = lvl.finish.position[0] * levelScale;
	finish.body.y = lvl.finish.position[1] * levelScale;
	game.world.bringToTop(finish);
    if(lvl.finish.type === "circle"){
    	finish.body.setCircle(20 * levelScale);
    }
    
    ball.body.x = lvl.start[0] * levelScale;
    ball.body.y = lvl.start[1] * levelScale;
	game.world.bringToTop(ball);
	ball.body.dynamic = true;
	
	graphics = game.add.graphics(0,0);
	//drawPolygons(graphics, polygons);
    
	timePassed = 0;
    loadingLevel = false;
	levelComplete = false;
	
	finish.body.setBodyContactCallback(ball, nextLevelHandler, this);
}

function drawPolygons(graphics, polygons){
	graphics.clear();
    for(let polygon of polygons){
        graphics.beginFill(0xff00ff);
        graphics.lineStyle(1,0xff0000);
        graphics.moveTo(polygon[0][0], polygon[0][1]);
        for(let i=1; i<polygon.length; i++){
            graphics.lineTo(polygon[i][0], polygon[i][1]);
        }
        graphics.endFill();
    }
}

function finishLevel(){
	document.getElementById('timePassed').innerHTML 			= timePassed / 1000;
	document.getElementById('newHighscore').style.visibility 	= trySettingNewHighscore(currentLevel, timePassed / 1000) ? "visible" : "hidden";
	document.getElementById('highscore').innerHTML 				= getHighscore(currentLevel);
	
    document.getElementById('levelCompletePopUp').style.display = "block";
    setTimeout(function(){document.getElementById('levelCompletePopUp').style.opacity = "1";}, 0);
}

function nextLevel(){
	if(!loadingLevel){
		loadingLevel = true;
		currentLevel = (currentLevel+1)%levelsCount;
		document.getElementById('levelCompletePopUp').style.display = "none";
		document.getElementById('levelCompletePopUp').style.opacity = "0";
		loadLevel(currentLevel);
	}
}

function getHighscore(level){
	return localStorage.getItem("hs"+level) || Infinity;
}
function trySettingNewHighscore(level, value){
	if(+getHighscore(level) < value){
		return false;
	}
	localStorage.setItem("hs"+level, value);
	return true;
}

function reset(body, x, y){
	body.setZeroVelocity();
	body.x = x;
	body.y = y;
}

var angularOrientation = {alpha: 0, beta: 0, gamma: 0};
var accelerationVector = [0, 0, 0];
var useAccelerationVector = false;

function getGravityVector(a, b, g){
    
    let toRad = function(deg){
        return Math.PI * deg / 180;
    }
    
    // ???
    a   = 0;
    b   = -toRad(b);
    g   = toRad(g);
    
    
    let as = Math.sin(a);
    let bs = Math.sin(b);
    let gs = Math.sin(g);
    let ac = Math.cos(a);
    let bc = Math.cos(b);
    let gc = Math.cos(g);
    
    var v = [0,0,-1];
    
    var resVectorYXZ = [];
    
    resVectorYXZ[0] = v[2] * (gc*bs*as - ac*gs);
    resVectorYXZ[1] = v[2] * (gc*ac*bs + gs*as);
    resVectorYXZ[2] = v[2] * (gc*bc);
    
    return resVectorYXZ;
}

function updateGravity(){
    if(useAccelerationVector){
        game.physics.box2d.gravity.x =   accelerationVector[0] * gravityForce;
        game.physics.box2d.gravity.y = - accelerationVector[1] * gravityForce;
        return;
    }
    let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma);
    game.physics.box2d.gravity.x = gravity[0] * gravityForce;
    game.physics.box2d.gravity.y = gravity[1] * gravityForce;
    
}

function updateGravityDebug(){
	ball.body.setZeroVelocity();
	if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
    {
        ball.body.x -= 10;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
    {
        ball.body.x += 10;
    }
    if (game.input.keyboard.isDown(Phaser.Keyboard.UP))
    {
        ball.body.y -= 10;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN))
    {
        ball.body.y += 10;
    }
}

var gn = new GyroNorm();

gn.init().then(function(){
  gn.start(function(data){
      
      if(
          false &&
          (accelerationVector[0] = data.dm.gx) && 
          (accelerationVector[1] = data.dm.gy) &&
          (accelerationVector[2] = data.dm.gz) )
      {
          useAccelerationVector = true;
      }
      else{
          useAccelerationVector = false;
          angularOrientation.alpha = data.do.alpha;
          angularOrientation.beta = data.do.beta;
          angularOrientation.gamma = data.do.gamma;
      }
      
      
  });
}).catch(function(e){
  console.log("No gyroscope support");
  //alert("Your device does not have a gyroscope, or doesn't support Device Orientation Events");
});


/*
function AAA(){
    let t = ["XYZ", "YXZ", "ZXY", "ZYX", "XZY", "YZX"];
    for(let i=0; i<8; i++){
        for(let j=0; j<6; j++){
            let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma, t[j], i);
            //console.log(i + ": " + t[j], gravity);
        }
    }
    let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma);
    console.log(gravity[0], gravity[1]);
    console.log(angularOrientation);
}
setInterval(AAA, 500);

function change(key, val){
    window[key] = val;
}

function test(){
    var cases = [
        [[0,0,0],       [0,0]],     // Flat
        [[0,180,0],     [0,0]],     // Flat reversed
        [[0,90,-90],    [-1, 0]],   // Left
        [[0,0,-90],    [-1, 0]],   // Left
        [[0,90,-90],    [-1, 0]],   // Left
        [[0,180,-90],     [1, 0]],    // Left
        [[0,90,90],     [1, 0]],    // Right
        [[0,0,90],     [1, 0]],    // Right
        [[0,180,90],     [1, 0]],    // Right
        [[0,90,0],    [0, 1]],      // Normal
        [[0,100,0],    [0, 1]],      // Normal
        [[0,80,0],    [0, 1]],      // Normal
        [[180,-90,0],    [0, -1]],    // Upside
        [[0,-90,0],    [0, -1]],    // Upside
        [[0,-80,0],    [0, -1]],    // Upside
        [[0,-100,0],    [0, -1]],    // Upside
        [[180,-80,0],    [0, -1]],    // Upside
        [[180,-100,0],    [0, -1]],    // Upside
    ];
    for(let i=0; i<cases.length; i++){
        let goods = [0,1,2,3,4,5,6,7];
        for(let i=0)
    }
}
*/