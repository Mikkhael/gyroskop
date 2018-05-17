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



var game = new Phaser.Game(window.innerWidth - 20, window.innerHeight - 20, Phaser.AUTO, '', { preload: preload, create: create, update: update });



function preload() {

    game.stage.disableVisibilityChange = true;
	game.stage.backgroundColor = "#ffffff";
    
    game.load.json('levels', 'assets/levels/levels.json');
    game.load.image('lvl1bg', 'assets/levels/lvl1.jpg');
    game.load.image('ball', 'assets/ball.png');

}

var ballScale = 0.25;

var walls, wallsCollisionGroup;

var ball, ballCollisionGroup;
var finish, finishCollisionGroup;
var background;
var levelsJson;

var graphics;

var gravityForce = 1000;

function create() {
    
    
	
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.restitution = 0.3;
    
    levelsJson = game.cache.getJSON('levels');
    
    walls = game.add.physicsGroup(Phaser.Physics.P2JS);
    
    ball = game.add.sprite(-100 * levelScale, -100 * levelScale, 'ball');
    ball.scale.setTo(ballScale * levelScale, ballScale * levelScale);
    
    game.physics.p2.enable(ball);
    ball.body.setCircle(50 * ballScale * levelScale);
    
    game.physics.p2.gravity.y = 0;
    game.physics.p2.gravity.x = 0;
    
    ball.body.dynamic = false;
    
    finish = game.add.sprite(0,0);
    game.physics.p2.enable(finish);
    finish.body.dynamic = false;
    
    finishCollisionGroup = game.physics.p2.createCollisionGroup();
    wallsCollisionGroup  = game.physics.p2.createCollisionGroup();
    ballCollisionGroup  = game.physics.p2.createCollisionGroup();
	
    finish.body.setCollisionGroup(finishCollisionGroup);
	ball.body.setCollisionGroup(ballCollisionGroup);
	ball.body.isBall = true;
	
    ball.body.collides([finishCollisionGroup, wallsCollisionGroup]);
    finish.body.collides([ballCollisionGroup]);
	
	finish.body.onBeginContact.add(function(body){
		if(body.isBall){
			finishLevel();
		}
	});
    
   
    loadLevel(currentLevel);
    
}

function update() {
    updateGravity();
}

var currentLevel = 0;

function loadLevel(num){
    let lvl = levelsJson[num];
    
    background = game.add.sprite(0,0,lvl.bg);
    background.scale.setTo(levelScale, levelScale);
    
    walls.removeAll();
    
    let polygons = lvl.walls.map( polygon => polygon.map(points => [levelScale * points[0] * 320 / 84.666664, levelScale * points[1] * 430 / 113.77084 ]));
    for(let polygon of polygons){
        let wall = walls.create(0,0);
	    wall.body.clearShapes();
        wall.body.addPolygon({}, polygon.map(x => x.filter(y => true)));
		wall.body.setCollisionGroup(wallsCollisionGroup);
		wall.body.collides(ballCollisionGroup);
        wall.body.dynamic = false;
    }
    
    finish.body.x = lvl.finish.position[0] * levelScale;
	finish.body.y = lvl.finish.position[1] * levelScale;
	game.world.bringToTop(finish);
    if(lvl.finish.type === "circle"){
    	finish.body.setCircle(20 * levelScale);
    	finish.body.setCollisionGroup(finishCollisionGroup);
    }
    
    //ball.body.position = new Phaser.Point(lvl.start[0], lvl.start[1]);
    ball.body.x = lvl.start[0] * levelScale;
    ball.body.y = lvl.start[1] * levelScale;
	game.world.bringToTop(ball);
	ball.body.dynamic = true;
	
	graphics = game.add.graphics(0,0);
	/*graphics.clear();
    for(let polygon of polygons){
        graphics.beginFill(0xff00ff);
        graphics.lineStyle(1,0xff0000);
        graphics.moveTo(polygon[0][0], polygon[0][1]);
        for(let i=1; i<polygon.length; i++){
            graphics.lineTo(polygon[i][0], polygon[i][1]);
        }
        graphics.endFill();
    }*/
    
        
}

function finishLevel(){
    document.getElementById('levelCompletePopUp').style.display = "block";
    setTimeout(function(){document.getElementById('levelCompletePopUp').style.opacity = "1";}, 0);
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
        game.physics.p2.gravity.x =   accelerationVector[0] * gravityForce;
        game.physics.p2.gravity.y = - accelerationVector[1] * gravityForce;
        return;
    }
    let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma);
    game.physics.p2.gravity.x = gravity[0] * gravityForce;
    game.physics.p2.gravity.y = gravity[1] * gravityForce;
    
}

function update() {
    updateGravity();
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
  alert("Your device does not have a gyroscope, or doesn't support Device Orientation Events");
});

//
//function AAA(){
//    let t = ["XYZ", "YXZ", "ZXY", "ZYX", "XZY", "YZX"];
//    for(let i=0; i<8; i++){
//        for(let j=0; j<6; j++){
//            let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma, t[j], i);
//            //console.log(i + ": " + t[j], gravity);
//        }
//    }
//    let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma);
//    console.log(gravity[0], gravity[1]);
//    console.log(angularOrientation);
//}
//setInterval(AAA, 500);
//
//function change(key, val){
//    window[key] = val;
//}
//
//function test(){
//    var cases = [
//        [[0,0,0],       [0,0]],     // Flat
//        [[0,180,0],     [0,0]],     // Flat reversed
//        [[0,90,-90],    [-1, 0]],   // Left
//        [[0,0,-90],    [-1, 0]],   // Left
//        [[0,90,-90],    [-1, 0]],   // Left
//        [[0,180,-90],     [1, 0]],    // Left
//        [[0,90,90],     [1, 0]],    // Right
//        [[0,0,90],     [1, 0]],    // Right
//        [[0,180,90],     [1, 0]],    // Right
//        [[0,90,0],    [0, 1]],      // Normal
//        [[0,100,0],    [0, 1]],      // Normal
//        [[0,80,0],    [0, 1]],      // Normal
//        [[180,-90,0],    [0, -1]],    // Upside
//        [[0,-90,0],    [0, -1]],    // Upside
//        [[0,-80,0],    [0, -1]],    // Upside
//        [[0,-100,0],    [0, -1]],    // Upside
//        [[180,-80,0],    [0, -1]],    // Upside
//        [[180,-100,0],    [0, -1]],    // Upside
//    ];
//    for(let i=0; i<cases.length; i++){
//        let goods = [0,1,2,3,4,5,6,7];
//        for(let i=0)
//    }
//}