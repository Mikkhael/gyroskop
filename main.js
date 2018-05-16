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

ORDER = "ZXY";
MASK = 7;

function getGravityVector(alpha, beta, gamma, order, mask){
    
    if(alpha === 0)
        alpha = 0;
    if(beta === 0)
        beta = 0;
    if(gamma === 0)
        gamma = 0;
    
    if(order === undefined){
        order = ORDER;
    }
    if(mask === undefined){
        mask = MASK;
    }
    //document.getElementById('tak').style.transform = `rotateZ(${alpha}deg) rotateX(${beta}deg) rotateY(${gamma}deg)`;
    //document.getElementById('orient').style.transform = `rotateY(${-gamma}deg) rotateX(${-beta}deg) rotateZ(${-alpha}deg)`;
    
    
    let axToAng = {
        Z: alpha,
        Y: gamma,
        X: beta,
    };
    
//    document.getElementById('tak').style.transform =
//    //"rotateX(90deg) " +
//    "rotateZ(" + ((mask & 1 ? -1 : 1) * axToAng[order[0]]) + "deg) " +
//    "rotateX(" + ((mask & 2 ? -1 : 1) * axToAng[order[1]]) + "deg) " +
//    "rotateY(" + ((mask & 4 ? -1 : 1) * axToAng[order[2]]) + "deg) " +
//    "";
//    
//     document.getElementById('orient').style.transform =
//    "rotateX(90deg) " +
//    "rotateZ(" + ( -alpha ) + "deg) " +
//    "rotateX(" + -beta + "deg) " +
//    "rotateY(" + ( -gamma ) + "deg)" +
//    "rotateY(" + ( gamma ) + "deg)" +
//    "rotateX(" + beta + "deg) " +
//    "rotateZ(" + ( alpha ) + "deg) " +
//    "";
    
    
    
    let rotate = function(axis, rad, vector){
        let res = [];
        let sin = Math.sin(rad);
        let cos = Math.cos(rad);
        
        switch(axis){
            case "X":{
                res[1] = vector[1] * cos - vector[2] * sin;
                res[2] = vector[1] * sin + vector[2] * cos;
                res[0] = vector[0];
                break;
            }
            case "Y":{
                res[2] = vector[2] * cos - vector[0] * sin;
                res[0] = vector[2] * sin + vector[0] * cos;
                res[1] = vector[1];
                break;
            }
            case "Z":{
                res[0] = vector[0] * cos - vector[1] * sin;
                res[1] = vector[0] * sin + vector[1] * cos;
                res[2] = vector[2];
                break;
            }
        }
        
        return res;
    }
    
    let toRad = function(deg){
        return Math.PI * deg / 180;
    }
    
    let gravity = [0,0,-1];
    
//    gravity = rotate("Y", 0,    gravity);
//    gravity = rotate("X", 0,    gravity);
//    gravity = rotate("Z", 0,    gravity);
    
    
    gravity = rotate(order[0], (mask & 1 ? -1 : 1) * axToAng[order[0]],          gravity);
    gravity = rotate(order[1], (mask & 2 ? -1 : 1) * axToAng[order[1]],          gravity);
    gravity = rotate(order[2], (mask & 4 ? -1 : 1) * axToAng[order[2]],          gravity);
    
    
    function normalized(v){
        let mag = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [v[0] / mag, v[1] / mag, v[2] / mag];
    }
    
    return normalized(gravity);
}

function updateGravity(){
    if(useAccelerationVector){
        game.physics.p2.gravity.x = accelerationVector[0] * gravityForce;
        game.physics.p2.gravity.y = accelerationVector[1] * gravityForce;
        return;
    }
    let gravity = getGravityVector(angularOrientation.alpha, angularOrientation.beta, angularOrientation.gamma);
    game.physics.p2.gravity.x = gravity[0] * gravityForce;
    game.physics.p2.gravity.y = gravity[1] * gravityForce;
    //console.log(gravity);
    
    
}

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

function update() {
    updateGravity();
}

var gn = new GyroNorm();

gn.init().then(function(){
  gn.start(function(data){
      
      if(
          (accelerationVector[0] = data.dm.gx) && 
          (accelerationVector[1] = -data.dm.gy) &&
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
      }
      
      
  });
}).catch(function(e){
  console.log("No gyroscope or accelerometer support");
});
setInterval(AAA, 500);

function change(key, val){
    window[key] = val;
}