const startBtn = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");
const startScreen = document.querySelector(".start-screen");
const checkpointScreen = document.querySelector(".checkpoint-screen");
const checkpointMessage = document.querySelector(".checkpoint-screen > p");
const ctx = canvas.getContext("2d");

//canvas will fill the whole browser viewport
canvas.width = innerWidth;
canvas.height = innerHeight;

// Game physics
const gravity = 0.5;
let isCheckpointCollisionDetectionActive = true;

// Helper function for responsive sizing
//ensures that game elements scale properly on different screen sizes
//standard height for laptops are 600 px
const proportionalSize = (size) => {
  return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
}

class Player {
  constructor() {
    //initial spawn position of player
    this.position = {
      x: proportionalSize(10),
      y: proportionalSize(400),   //this is in negative y position sa cartesian plane but naka absolute value
    };
    //box is not moving initially
    this.velocity = {
      x: 0,
      y: 0,
    };
    //box is 40x40 (if innerHeight is > 500)
    this.width = proportionalSize(40);
    this.height = proportionalSize(40);
  }

  draw() {
    ctx.fillStyle = "#99c9ff";    //for 2D canvas API - specifies the color
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);  // Canvas 2D API is used to draw a filled rectangle on the canvas | (x-coordinate, y-coordinate, width, height)
  }
  
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    //checks if player's position would be above or at the bottom of the canvas (murag nagjump)
    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      // If true, the player is not touching the bottom of the canvas

      if (this.position.y < 0) {    // This inner if checks if the player has gone above the top of the canvas
        this.position.y = 0;        // If true, reposition the player to the top edge of the canvas
        this.velocity.y = gravity;  // Set velocity to gravity, effectively starting the fall
      }
      
      this.velocity.y += gravity;   // Regardless of whether the player hit the top, apply gravity
    } else {
      // If the outer if is false, the player has reached or gone below the bottom of the canvas
      // Stop vertical movement by setting velocity to 0
      this.velocity.y = 0;
    }

    //for Horizontal Boundaries
    //These prevent the player from moving off the left or right edges of the canvas
    // Check if the player is going beyond the left boundary
    if (this.position.x < this.width) {
      // If true, set the player's x position to the left boundary equal to the player's width.
      this.position.x = this.width;  
    }

    // Check if the player is going beyond the right boundary
    if (this.position.x >= canvas.width - this.width * 2) {
       // If true, set the player's x position to the right boundary
      this.position.x = canvas.width - this.width * 2;  // * 2 is used because this.position.x represents the left edge of the player, not the center.
    }
  }
}

class Platform {
  constructor(x, y) {
    this.position = {
      x,
      y,
    };
    this.width = 200;
    this.height = proportionalSize(40);
  }
  draw() {
    ctx.fillStyle = "#acd157";
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

class CheckPoint {
  constructor(x, y, z) {  //z is pretty much an unused property. it just indicates how many checkpoints there are
    this.position = {
      x,
      y,
    };
    this.width = proportionalSize(40);
    this.height = proportionalSize(70);
    this.claimed = false;
  };

  draw() {
    ctx.fillStyle = "#f1be32";
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
  claim() {
    this.width = 0;
    this.height = 0;
    this.position.y = Infinity;   //moves the checkpoint out of the screen when claimed
    this.claimed = true;
  }
};

const player = new Player();

const platformPositions = [
  { x: 500, y: proportionalSize(450) },
  { x: 700, y: proportionalSize(400) },
  { x: 850, y: proportionalSize(350) },
  { x: 900, y: proportionalSize(350) },
  { x: 1050, y: proportionalSize(150) },
  { x: 2500, y: proportionalSize(450) },
  { x: 2900, y: proportionalSize(400) },
  { x: 3150, y: proportionalSize(350) },
  { x: 3900, y: proportionalSize(450) },
  { x: 4200, y: proportionalSize(400) },
  { x: 4400, y: proportionalSize(200) },
  { x: 4700, y: proportionalSize(150) },
];

// This is how the platforms objects are created
const platforms = platformPositions.map(
  (platform) => new Platform(platform.x, platform.y)    //For each platform, it creates a new object of Platform instance using the x and y values from that object | object creation: new Platform(platform.x, platform.y)
);

const checkpointPositions = [
  { x: 1170, y: proportionalSize(80), z: 1 },
  { x: 2900, y: proportionalSize(330), z: 2 },
  { x: 4800, y: proportionalSize(80), z: 3 },
];

//creates the checkpoints objects
const checkpoints = checkpointPositions.map(
  (checkpoint) => new CheckPoint(checkpoint.x, checkpoint.y, checkpoint.z)
);

//Game Loop:
//The animate function serves as the main game loop. It clears the canvas, updates game objects, and handles collisions.
const animate = () => {
  requestAnimationFrame(animate);   // standard way to create efficient, smooth animations in web application | creates a loop where animate is called repeatedly, typically around 60 times per second (matching most display refresh rates).
  ctx.clearRect(0, 0, canvas.width, canvas.height);   //clears the entire canvas for each frame
  //It then draws all platforms and checkpoints.
  //calling the draw() method on each previously created platform object
  platforms.forEach((platform) => {
    platform.draw();  //renders platform on the canvas
  });

  //calling the draw() method on each previously created checkpoint object
  checkpoints.forEach(checkpoint => {
    checkpoint.draw();  //renders checkpoints on the canvas
  });

  player.update();

  
  if (keys.rightKey.pressed && player.position.x < proportionalSize(400)) {
    player.velocity.x = 5;  //moves player to the right when right key is pressed and if positioned on the left side (player.position.x < 400px)
  } else if (keys.leftKey.pressed && player.position.x > proportionalSize(100)) {
    player.velocity.x = -5;   //moves player to the left when left key is pressed and if positioned on the right side (player.position.x > 100px)
  } else {  //if it doesnt meet previous statements (most likely the player position conditions)
    //Otherwise, if the right or left key is pressed and checkpoint collision detection is active,
    //move the platforms and checkpoints instead of the player, creating a scrolling effect.
    player.velocity.x = 0;  

    if (keys.rightKey.pressed && isCheckpointCollisionDetectionActive) {  //player is moving to the right but platform & checkpoint will move to the left
      platforms.forEach((platform) => {
        platform.position.x -= 5;
      });

      checkpoints.forEach((checkpoint) => {
        checkpoint.position.x -= 5;
      });
    
    } else if (keys.leftKey.pressed && isCheckpointCollisionDetectionActive) {  //player is moving to the left but platform & checkpoint will move to the right
      platforms.forEach((platform) => {
        platform.position.x += 5;
      });

      checkpoints.forEach((checkpoint) => {
        checkpoint.position.x += 5;
      });
    }
  }

  platforms.forEach((platform) => {
    const collisionDetectionRules = [
      player.position.y + player.height <= platform.position.y,     //checks if player is above or same level sa platform |  ensures the player is not already below the platform.
      player.position.y + player.height + player.velocity.y >= platform.position.y,   //checks if the player's next position (considering its current velocity) will be at or below the top of the platform. It detects if the player is about to land on the platform.
      player.position.x >= platform.position.x - player.width / 2,  //checks if the player's left edge is to the right of the platform's left edge (with a small buffer of half the player's width). It ensures the player is not too far to the left of the platform.
      player.position.x <= platform.position.x + platform.width - player.width / 3,   //checks if the player's left edge is to the left of the platform's right edge (with a small buffer of one-third of the player's width). It ensures the player is not too far to the right of the platform.
    ];

    if (collisionDetectionRules.every((rule) => rule)) {      //If all these rules are true, it means the player is about to land on top of the platform, 
      player.velocity.y = 0;                                  //so the player's vertical velocity is set to 0 to stop the fall.
      return;
    }

    const platformDetectionRules = [
      player.position.x >= platform.position.x - player.width / 2,    //checks if the player's left edge is to the right of the platform's left edge (with a small buffer of half the player's width). It ensures the player is not too far to the left of the platform.
      player.position.x <= platform.position.x + platform.width - player.width / 3,   //checks if the player's left edge is to the left of the platform's right edge (with a small buffer of one-third of the player's width). It ensures the player is not too far to the right of the platform.
      player.position.y + player.height >= platform.position.y,   //checks if player is at the bottom of the platform | ensures the player is not above the platform.
      player.position.y <= platform.position.y + platform.height, // checks if the top of the player is at or above the bottom of the platform. It ensures the player is not below the platform.
    ];

    if (platformDetectionRules.every(rule => rule)) {           //If all these rules are true, it means the player is colliding with the platform (from any direction, not just from above).
      player.position.y = platform.position.y + player.height;  //In this case, the player's vertical position is adjusted to be on top of the platform, and
      player.velocity.y = gravity;                              //the vertical velocity is set to the gravity value, effectively "sticking" the player to the platform.
    };
  });

  checkpoints.forEach((checkpoint, index, checkpoints) => {
    const checkpointDetectionRules = [
      player.position.x >= checkpoint.position.x,   //checks if the player's left edge is at or to the right of the checkpoint's left edge. It ensures the player has reached or passed the checkpoint horizontally.
      player.position.y >= checkpoint.position.y,   //checks if the player's top edge is at or below the checkpoint's top edge. It ensures the player is not above the checkpoint.
      player.position.y + player.height <= checkpoint.position.y + checkpoint.height,   // checks if the player's bottom edge is at or above the checkpoint's bottom edge. It ensures the player is not below the checkpoint.
      isCheckpointCollisionDetectionActive,   // checks if checkpoint collision detection is currently active in the game.
      player.position.x - player.width <= checkpoint.position.x - checkpoint.width + player.width * 0.9,  // checks if the player's right edge is within 90% of the checkpoint's width from its left edge. It ensures the player doesn't overshoot the checkpoint too much.
      index === 0 || checkpoints[index - 1].claimed === true,   //ensures that either this is the first checkpoint (index === 0) or the previous checkpoint has been claimed. It prevents players from claiming checkpoints out of order.
    ];

    if (checkpointDetectionRules.every((rule) => rule)) {
      checkpoint.claim();

      if (index === checkpoints.length - 1) {   //checks if at the last checkpoint
        isCheckpointCollisionDetectionActive = false;   //set to false, effectively ending the game
        showCheckpointScreen("You reached the final checkpoint!");
        movePlayer("ArrowRight", 0, false);     //stops movement
      }else if (player.position.x >= checkpoint.position.x && player.position.x <= checkpoint.position.x + 40) {    //If it's not the last checkpoint, and the player is within the first 40 pixels of the checkpoint
        showCheckpointScreen("You reached a checkpoint!");
      }
    };
  });
}

//Its main purpose is to maintain the state of certain keys (left and right) for use in other parts of the game logic,
//particularly in the animate function for collision detection and world scrolling.
const keys = {
  rightKey: {
    pressed: false
  },
  leftKey: {
    pressed: false
  }
};

//It updates the keys object, but its primary job is to immediately affect the player's velocity based on key presses.
const movePlayer = (key, xVelocity, isPressed) => {
  if (!isCheckpointCollisionDetectionActive) {
    player.velocity.x = 0;
    player.velocity.y = 0;
    return;
  }

  switch (key) {
    case "ArrowLeft":
      keys.leftKey.pressed = isPressed;
      if (xVelocity === 0) {
        player.velocity.x = xVelocity;
      }
      player.velocity.x -= xVelocity;
      break;
    case "ArrowUp":
    case " ":
    case "Spacebar":
      player.velocity.y -= 8;
      break;
    case "ArrowRight":
      keys.rightKey.pressed = isPressed;
      if (xVelocity === 0) {
        player.velocity.x = xVelocity;
      }
      player.velocity.x += xVelocity;
  }
}

const startGame = () => {
  canvas.style.display = "block";
  startScreen.style.display = "none";
  animate();
}

const showCheckpointScreen = (msg) => {
  checkpointScreen.style.display = "block";
  checkpointMessage.textContent = msg;
  if (isCheckpointCollisionDetectionActive) {
    setTimeout(() => (checkpointScreen.style.display = "none"), 2000);  //if not the last checkpoint, message will disapper after 2 seconds
  }
};

startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", ({ key }) => {   //for ArrowRight, ArrowLeft, ArrowUp, Spacebar, " "
  movePlayer(key, 8, true);
});

window.addEventListener("keyup", ({ key }) => {   //nothing is pressed, do nothing
  movePlayer(key, 0, false);
});
