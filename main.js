var game = new Phaser.Game(320, 430, Phaser.AUTO, 'tak', { preload: preload, create: create, update: update });



function preload() {

    game.stage.disableVisibilityChange = true;
    
    game.load.image('background', 'assets/lvl.jpg');
    game.load.json('level', 'assets/lvlv2.json');
    game.load.image('ball', 'assets/ball.png');

}

const levelScale = 1;
const ballScale = 0.25;
var walls;
var ball;

var graphics;

var gravityForce = 300;

function create() {
    
    graphics = game.add.graphics(0,0);
    
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.restitution = 0.1;
    
    let bg = game.add.sprite(0,0,'background');
    bg.scale.setTo(levelScale, levelScale);
    
    var json = game.cache.getJSON('level').map( polygon => polygon.map(points => [points[0] * 320 / 84.666664, points[1] * 430 / 113.77084 ]));
    
    
    walls = game.add.physicsGroup(Phaser.Physics.P2JS);
    for(let polygon of json){
        let wall = walls.create(0,0);
	    wall.body.clearShapes();
        //wall.body.addPolygon({}, polygon.map(x => x.filter(y => true)));
        wall.body.addPolygon({}, polygon);
        wall.body.dynamic = false;
    }
    
    
    ball = game.add.sprite(160, 20, 'ball');
    ball.scale.setTo(ballScale, ballScale);
    
    game.physics.p2.enable(ball);
    ball.body.setCircle(50 * ballScale);
    
    game.physics.p2.gravity.y = 0;
    game.physics.p2.gravity.x = 0;
    
    
    /*graphics.clear();
    for(let polygon of json){
        graphics.beginFill(0xff00ff);
        graphics.lineStyle(1,0xff0000);
        graphics.moveTo(polygon[0][0], polygon[0][1]);
        for(let i=1; i<polygon.length; i++){
            graphics.lineTo(polygon[i][0], polygon[i][1]);
        }
        graphics.endFill();
    }*/
    
    
}

var angularOrientation = {alpha: 0, beta: 0, gamma: 0};
var accelerationVector = [0, 0, 0];
var useAccelerationVector = false;

function getGravityVector(a, b, g){
    
//     document.getElementById('orient').style.transform =
//    //"rotateX(90deg) " +
//    "rotateZ(" + (-a) + "deg) " +
//    "rotateX(" + b + "deg) " +
//    "rotateY(" + (-g) + "deg) " +
//    "";
    
    let toRad = function(deg){
        return Math.PI * deg / 180;
    }
    
    // Nie iwem dlaczego, ale tak działa
    a   = 0;
    b   = -toRad(b);
    g   = toRad(g);
    
    
	/*
    var qw, qx, qy, qz;
    
    var cy = Math.cos(yaw * 0.5);
	var sy = Math.sin(yaw * 0.5);
	var cr = Math.cos(roll * 0.5);
	var sr = Math.sin(roll * 0.5);
	var cp = Math.cos(pitch * 0.5);
	var sp = Math.sin(pitch * 0.5);

	qw = cy * cr * cp + sy * sr * sp;
	qx = cy * sr * cp - sy * cr * sp;
	qy = cy * cr * sp + sy * sr * cp;
	qz = sy * cr * cp - cy * sr * sp;
    
    qw2 = qw*qw;
    qx2 = qx*qx;
    qy2 = qy*qy;
    qz2 = qz*qz;
    
    let m = [[],[],[]];
    m[0][0] = 1 - 2*qy2 - 2*qz2;
    m[0][1] = 2*qx*qy - 2*qz*qw;
    m[0][2] = 2*qx*qz + 2*qy*qw;
    m[1][0] = 2*qx*qy + 2*qz*qw;
    m[1][1] = 1 - 2*qx2 - 2*qz2;
    m[1][2] = 2*qy*qz - 2*qx*qw;
    m[2][0] = 2*qx*qz - 2*qy*qw;
    m[2][1] = 2*qy*qz + 2*qx*qw;
    m[2][2] = 1 - 2*qx2 - 2*qy2;
    
    var v = [0,0,-1];
    var resVector = [
        v[0] * m[0][0] + v[1] * m[0][1] + v[2] * m[0][2],
        v[0] * m[1][0] + v[1] * m[1][1] + v[2] * m[1][2],
        v[0] * m[2][0] + v[1] * m[2][1] + v[2] * m[2][2]
    ]
    
    return resVector;
    */
    
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
          document.body.style.backgroundColor = "gray";
          useAccelerationVector = true;
      }
      else{
          useAccelerationVector = false;
          angularOrientation.alpha = data.do.alpha;
          angularOrientation.beta = data.do.beta;
          angularOrientation.gamma = data.do.gamma;
          document.body.style.backgroundColor = "dimgray";
      }
      
      
  });
}).catch(function(e){
  console.log("No gyroscope or accelerometer support");
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
//    
//    
//    for(let i=0; i<cases.length; i++){
//        
//        let goods = [0,1,2,3,4,5,6,7];
//        for(let i=0)
//    }
//}