var currentVersion = 0.3;
var gameSpeed = 1;
var TAS_gameSlowdown = 1;
var frameTime = 1000/60;
var savestate ="";
var player = {
  spawnPoint: newSave(),
  isDead: false,
  spawnDelay: 0,//Math.floor((options.spawnDelay * 100) / 3),
  spawnTimer: 0,//Math.floor((options.spawnDelay * 100) / 3),
  levelCoord: [0, 0],
  get currentLevel() {
    return worldMap[player.levelCoord[0]][player.levelCoord[1]];
  },
  x: 0,
  y: 0,
  xv: 0,
  yv: 0,
  g: 325,
  canWalljump: false,
  canJump: true,
  currentJumps: 0,
  maxJumps: 1,
  moveSpeed: 600,
  triggers: [],
  godMode: false,
  reachedHub: false,
  deaths: 0,
  timePlayed: 0,
  branchTime: 0,
  finalDeaths: 0,
  finalTimePlayed: 0,
  gameComplete: false
};
const control = {
  left: false,
  right: false,
  up: false,
  down: false,
  space: false
};
const hasHitbox = [1, 5, 11, 40];
const prefix = diff === "" ? "" : "../";
const music = {
  hub: initAudio(prefix + "audio/jap_hub.wav"),
  grav: initAudio(prefix + "audio/jap_grav.wav"),
  mj: initAudio(prefix + "audio/jap_mj.wav"),
  wj: initAudio(prefix + "audio/jap_wj.wav"),
  speed: initAudio(prefix + "audio/jap_speed.wav"),
  final: initAudio(prefix + "audio/jap_final.wav"),
  end: initAudio(prefix + "audio/jap_end.wav")
};
var currentlyPlaying = null;
function initAudio(url) {
  let a = new Audio(url);
  a.loop = true;
  a.volume = 0;
  return a;
}
var fadein = null;
var fadeout = null;
var toFadein = null;
var fromRespawn = false;
function playAudio(target) {
  if (currentlyPlaying === target) return;
  if (currentlyPlaying) {
    if (fadeout) {
      fadeout.volume = 0;
      fadeout.pause();
      fadeout.currentTime = 0;
      fadeout = null;
    }
    fadeout = currentlyPlaying;
  }
  if (toFadein) clearTimeout(toFadein);
  if (target) {
    toFadein = setTimeout(function () {
      target.play();
      fadein = target;
      currentlyPlaying = target;
      toFadein = null;
    }, 2500);
  } else toFadein = null;
}
function updateAudio() {
  switch (true) {
    case player.currentLevel === 8 || player.currentLevel === 9:
      playAudio(music.hub);
      break;
    case player.currentLevel >= 10 && player.currentLevel <= 27:
      playAudio(music.grav);
      break;
    case player.currentLevel >= 28 && player.currentLevel <= 45:
      playAudio(music.mj);
      break;
    case player.currentLevel >= 46 && player.currentLevel <= 64:
      playAudio(music.wj);
      break;
    case player.currentLevel >= 65 && player.currentLevel <= 76:
      playAudio(music.speed);
      break;
    case player.currentLevel >= 77 && player.currentLevel <= 87:
      playAudio(music.final);
      break;
    case player.currentLevel === 88:
      playAudio(music.end);
      break;
    default:
      playAudio(null);
  }
}
var audioInitDone = false;
document.addEventListener("keydown", function (input) {
  if (!audioInitDone) {
    updateAudio();
    audioInitDone = true;
  }
  let key = input.code;
  switch (key) {
    case "ArrowUp":
    case "KeyW":
      control.up = true;
      break;
    case "ArrowDown":
    case "KeyS":
      control.down = true;
      break;
    case "ArrowLeft":
    case "KeyA":
      control.left = true;
      break;
    case "ArrowRight":
    case "KeyD":
      control.right = true;
      break;
    case "Space":
      control.space = true;
      break;
    case "Delete":
      wipeSave();
      break;
    case "KeyR":
	  if (modal.style.display == "none"){
      if (input.shiftKey) {
        if (player.reachedHub) {
          if (confirm("Are you sure you want to go to the hub?")) {
            player.spawnPoint = [
              7,
              5,
              5,
              4,
              325,
              1,
              600,
              [...player.triggers],
              currentVersion,
              true,
              player.timePlayed,
              player.deaths,
              player.gameComplete,
              player.finalTimePlayed,
              player.finalDeaths,
              0
            ];
			fromRespawn = true;
            respawn();
          }
        } else alert("You have not reached the hub yet.");
      } else {
        player.isDead = true;
        player.spawnTimer = 0;
		fromRespawn = true;
      }
	  }
      break;
    case "KeyC":
	  if (modal.style.display == "none") openInfo();
      break;
    case "Backslash":
      if (input.shiftKey) {
        importSave();
      } else exportSave();
      break;
	 case "KeyT":
		if (modal.style.display == "none" && id("mainInfo").style.opacity == 0) {
		  gameRunning = false;
		// set the current value of TAS in the input element
		  input.value = TAS_str;

		  // add the fade-in class to the modal
		  modal.classList.add("fade-in");

		  // display the modal
		  modal.style.display = "block";
		  setTimeout(function(){
		  tasInput.focus()
		  },1); //goofy trick to not type the t in the textarea
		}
	case "Enter":
	  if (input.shiftKey && modal.style.display != "none") {
		  tasInput.value = tasInput.value.trim(); //remove trailing enter
		  saveTasBtn.click();
	  }
    default:
      break;
  }
});

document.addEventListener("keyup", function (input) {
  let key = input.code;
  switch (key) {
    case "ArrowUp":
    case "KeyW":
      control.up = false;
      if (!control.down && !control.space) player.canJump = true;
      break;
    case "ArrowDown":
    case "KeyS":
      control.down = false;
      if (!control.up && !control.space) player.canJump = true;
      break;
    case "ArrowLeft":
    case "KeyA":
      control.left = false;
      break;
    case "ArrowRight":
    case "KeyD":
      control.right = false;
      break;
    case "Space":
      control.space = false;
      if (!control.up && !control.down) player.canJump = true;
      break;
    default:
      break;
  }
});

//var lastFrame = 0;
var simReruns = 20;
var sinceLastSave = 0;
var noFriction = false;
var branchInProgress = true;
var TAStrigger = false;
var lastTAStrigger = false;
var triggerBlocksToReplace = [];
function nextFrame(/*timeStamp*/) {
  // setup stuff
  //let dt = timeStamp - lastFrame;
  parseInput(currentFrame);
  if (gameRunning == false) return;
  currentFrame++;
  let dt = frameTime; //new
  /*if (dt === 0) {
    window.requestAnimationFrame(nextFrame);
    return;
  }*/
  player.timePlayed += dt;
  if (branchInProgress) player.branchTime += dt;
  player.spawnPoint[10] = player.timePlayed;
  player.spawnPoint[15] = player.branchTime;
  id("timePlayed").innerHTML = formatTime(player.timePlayed);
  id("top-time").innerHTML = formatTime(player.timePlayed, false);
  id("branchTime").innerHTML = formatTime(player.branchTime);
  id("bottom-time").innerHTML = formatTime(player.branchTime, false)+" ("+currentFrame+")";
  id("timer").innerHTML =
    formatTime(player.timePlayed, false) +
    "<br>" +
    formatTime(player.branchTime, false);
  if (player.finalTimePlayed > 0) {
	  id("top-time").innerHTML = formatTime(player.finalTimePlayed, false);
  }
  sinceLastSave += dt;
  if (sinceLastSave >= 5000) {
    save();
    sinceLastSave -= 5000;
  }
  if (fadein) {
    fadein.volume = Math.min(
      fadein.volume + (dt / 5000) * options.volume,
      options.volume
    );
    if (fadein.volume === options.volume) fadein = null;
  }
  if (fadeout) {
    fadeout.volume = Math.max(fadeout.volume - (dt / 5000) * options.volume, 0);
    if (fadeout.volume === 0) {
      fadeout.pause();
      fadeout.currentTime = 0;
      fadeout = null;
    }
  }
  dt *= gameSpeed;
  //lastFrame = timeStamp;
  if (dt < 100 * gameSpeed) {
    dt = dt / simReruns;
    let xprev = player.x;
    let yprev = player.y;
    let lvlxprev = player.levelCoord[0];
    let lvlyprev = player.levelCoord[1];
    let triggersPrev = [...player.triggers];
    let shouldDrawLevel = false;
    for (let i = 0; i < simReruns; i++) {
		lastTAStrigger = TAStrigger;
		TAStrigger = false;
      // some weird fricker to do stuff
      if (!player.isDead) {
        player.x += (player.xv * dt) / 500;
        player.y +=
          (player.yv * dt) / 500 + ((player.g / 2) * dt * dt) / 500 / 500;
        // velocity change
        if (!noFriction) {
          player.xv *= Math.pow(0.5, dt / 6);
          if (Math.abs(player.xv) < 5) player.xv = 0;
        }
        if (
          (player.yv > player.g && player.g > 0) ||
          (player.yv < player.g && player.g < 0)
        ) {
          player.yv -= (player.g * dt) / 500;
          if (Math.abs(player.yv) < player.g) player.yv = player.g;
        } else {
          player.yv += (player.g * dt) / 500;
        }
      }
      // collision detection
      if (i === 0) {
        player.canWalljump = false;
      }
      let level = levels[player.currentLevel];
      let onIce = false;
      let shouldDie = false;
      let bx1 = Math.floor((player.x - 0.001) / blockSize);
      let bx2 = Math.floor((player.x + playerSize) / blockSize);
      let by1 = Math.floor((player.y - 0.001) / blockSize);
      let by2 = Math.floor((player.y + playerSize) / blockSize);
      let wallLeft = false;
      let wallRight = false;
      let wallTop = false;
      let wallBottom = false;
      // solid blocks
      for (let x = bx1; x <= bx2; x++) {
        for (let y = by1; y <= by2; y++) {
          if (
            lvlxprev !== player.levelCoord[0] ||
            lvlyprev !== player.levelCoord[1]
          )
            break;
          let type = getBlockType(x, y);
          let props = type;
          if (typeof type === "object") type = type[0];
          let onLeft = false;
          let onRight = false;
          let onTop = false;
          let onBottom = false;
          if (hasHitbox.includes(type)) {
            let dx1 = Math.abs(
              (player.x - (x + 1) * blockSize) / Math.min(-1, player.xv)
            );
            let dx2 = Math.abs(
              (player.x + playerSize - x * blockSize) / Math.max(1, player.xv)
            );
            let dy1 = Math.abs(
              (player.y - (y + 1) * blockSize) / Math.min(-1, player.yv)
            );
            let dy2 = Math.abs(
              (player.y + playerSize - y * blockSize) / Math.max(1, player.yv)
            );
            // top left corner
            if (x === bx1 && y === by1) {
              if (dx1 < dy1 && !hasHitbox.includes(getBlockType(x + 1, y))) {
                onLeft = true;
              } else if (!hasHitbox.includes(getBlockType(x, y + 1))) {
                onTop = true;
              }
            }
            // bottom left corner
            else if (x === bx1 && y === by2) {
              if (dx1 < dy2 && !hasHitbox.includes(getBlockType(x + 1, y))) {
                onLeft = true;
              } else if (!hasHitbox.includes(getBlockType(x, y - 1))) {
                onBottom = true;
              }
            }
            // top right corner
            else if (x === bx2 && y === by1) {
              if (dx2 < dy1 && !hasHitbox.includes(getBlockType(x - 1, y))) {
                onRight = true;
              } else if (!hasHitbox.includes(getBlockType(x, y + 1))) {
                onTop = true;
              }
            }
            // bottom right corner
            else if (x === bx2 && y === by2) {
              if (dx2 < dy2 && !hasHitbox.includes(getBlockType(x - 1, y))) {
                onRight = true;
              } else if (!hasHitbox.includes(getBlockType(x, y - 1))) {
                onBottom = true;
              }
            }
            // bottom right corner
            else if (x === bx2 && y === by2) {
              if (
                Math.abs(
                  (x * blockSize - (player.x + playerSize)) /
                    Math.max(1, Math.abs(player.xv))
                ) <
                  Math.abs(
                    (y * blockSize - (player.y + playerSize)) /
                      Math.max(1, Math.abs(player.yv))
                  ) &&
                !hasHitbox.includes(getBlockType(x - 1, y))
              ) {
                onRight = true;
              } else if (!hasHitbox.includes(getBlockType(x, y - 1))) {
                onBottom = true;
              }
            }
            // left bound
            else if (x === bx1) wallLeft = true;
            // right bound
            else if (x === bx2) wallRight = true;
            // top bound
            else if (y === by1) wallTop = true;
            // bottom bound
            else if (y === by2) wallBottom = true;
            // inside
            else shouldDie = true;
            // velocity check
            if (player.xv < 0) {
              onRight = false;
            } else if (player.xv > 0) onLeft = false;
            if (player.yv < 0) {
              onBottom = false;
            } else if (player.yv > 0) onTop = false;
            // touching side special event
            if (onLeft) {
              wallLeft = true;
              switch (type) {
                case 11:
                  if (!player.xg) {
                    player.canWalljump = true;
                    player.wallJumpDir = "right";
                    if (player.yv > player.g / 10 && player.g > 0)
                      player.yv = player.g / 10;
                    if (player.yv < player.g / 10 && player.g < 0)
                      player.yv = player.g / 10;
                  }
                  break;
                default:
                  break;
              }
            }
            if (onRight) {
              wallRight = true;
              switch (type) {
                case 11:
                  if (!player.xg) {
                    player.canWalljump = true;
                    player.wallJumpDir = "left";
                    if (player.yv > player.g / 10 && player.g > 0)
                      player.yv = player.g / 10;
                    if (player.yv < player.g / 10 && player.g < 0)
                      player.yv = player.g / 10;
                  }
                  break;
                default:
                  break;
              }
            }
            if (onTop) {
              wallTop = true;
              switch (type) {
                case 5:
                  for (let j = bx1; j <= bx2; j++) {
                    let jtype = getBlockType(j, y);
                    if (
                      hasHitbox.includes(jtype) &&
                      jtype !== 5 &&
                      !hasHitbox.includes(getBlockType(j, y + 1))
                    )
                      break;
                    if (j === bx2 && player.g < 0)
                      player.yv = Math.max(275, player.yv);
                  }
                  break;
                case 40:
                  for (let j = bx1; j <= bx2; j++) {
                    let jtype = getBlockType(j, y);
                    if (
                      hasHitbox.includes(jtype) &&
                      jtype !== 40 &&
                      !hasHitbox.includes(getBlockType(j, y + 1))
                    )
                      break;
                    if (j === bx2) onIce = true;
                  }
                  break;
                default:
                  break;
              }
            }
            if (onBottom) {
              wallBottom = true;
              switch (type) {
                case 5:
                  for (let j = bx1; j <= bx2; j++) {
                    let jtype = getBlockType(j, y);
                    if (
                      hasHitbox.includes(jtype) &&
                      jtype !== 5 &&
                      !hasHitbox.includes(getBlockType(j, y - 1))
                    )
                      break;
                    if (j === bx2 && player.g > 0)
                      player.yv = Math.min(-275, player.yv);
                  }
                  break;
                case 40:
                  for (let j = bx1; j <= bx2; j++) {
                    let jtype = getBlockType(j, y);
                    if (
                      hasHitbox.includes(jtype) &&
                      jtype !== 40 &&
                      !hasHitbox.includes(getBlockType(j, y - 1))
                    )
                      break;
                    if (j === bx2) onIce = true;
                  }
                  break;
                default:
                  break;
              }
            }
          }
        }
      }
      if (
        lvlxprev !== player.levelCoord[0] ||
        lvlyprev !== player.levelCoord[1]
      )
        break;
      // ice lol
      if (onIce) {
        noFriction = true;
      } else noFriction = false;
      // collision action
      let onFloor = false;
      if (wallLeft) {
        player.x = (bx1 + 1) * blockSize;
        player.xv = Math.max(0, player.xv);
      }
      if (wallRight) {
        player.x = bx2 * blockSize - playerSize;
        player.xv = Math.min(0, player.xv);
      }
      if (wallTop) {
        player.y = (by1 + 1) * blockSize;
        player.yv = Math.max(0, player.yv);
        if (player.g < 0 && player.yv <= 0) onFloor = true;
      }
      if (wallBottom) {
        player.y = by2 * blockSize - playerSize;
        player.yv = Math.min(0, player.yv);
        if (player.g > 0 && player.yv >= 0) onFloor = true;
      }
      // fully in block
      if (
        hasHitbox.includes(getBlockType(bx1, by1)) &&
        hasHitbox.includes(getBlockType(bx1, by2)) &&
        hasHitbox.includes(getBlockType(bx2, by1)) &&
        hasHitbox.includes(getBlockType(bx2, by2))
      )
        shouldDie = true;
      if (!shouldDie) {
        for (let x = bx1; x <= bx2; x++) {
          for (let y = by1; y <= by2; y++) {
            if (
              lvlxprev !== player.levelCoord[0] ||
              lvlyprev !== player.levelCoord[1]
            )
              break;
            let type = getBlockType(x, y);
            let props = type;
            if (typeof type === "object") type = type[0];
            if (
              player.x < (x + 1) * blockSize - 0.01 &&
              player.x + playerSize > x * blockSize + 0.01 &&
              player.y < (y + 1) * blockSize - 0.01 &&
              player.y + playerSize > y * blockSize + 0.01
            ) {
              switch (type) {
                // grav-dir
                case 6:
                  player.xg = false;
                  if (player.g > 0) {
					  triggerHit("GravityUp["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
					  player.g = -player.g;
				  }
                  break;
                case 7:
                  player.xg = false;
                  if (player.g < 0) {
					  player.g = -player.g;
				  triggerHit("GravityDown["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
				  }
                  break;
                // grav magnitude
                case 8:
				  if (Math.abs(player.g) != 170) triggerHit("GravityLow["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.g = Math.sign(player.g) * 170;
                  break;
                case 9:
				  if (Math.abs(player.g) != 325) triggerHit("GravityMedium["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.g = Math.sign(player.g) * 325;
                  break;
                case 10:
				  if (Math.abs(player.g) != 650) triggerHit("GravityHigh["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.g = Math.sign(player.g) * 650;
                  break;
                // multi-jump
                case 12:
				  if (player.maxJumps != 0) triggerHit("ZeroJump["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.maxJumps = 0;
                  player.currentJumps = player.maxJumps;
                  break;
                case 13:
				  if (player.maxJumps != 1) triggerHit("OneJump["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.maxJumps = 1;
                  player.currentJumps = player.maxJumps;
                  break;
                case 14:
				  if (player.maxJumps != 2 || player.currentJumps < 1) triggerHit("TwoJump["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.maxJumps = 2;
                  player.currentJumps = player.maxJumps;
                  break;
                case 15:
				  if (player.maxJumps != 3 || player.currentJumps < 2) triggerHit("ThreeJump["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.maxJumps = 3;
                  player.currentJumps = player.maxJumps;
                  break;
                case 16:
				  if (player.maxJumps != Infinity) triggerHit("InfiniteJump["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.maxJumps = Infinity;
                  player.currentJumps = player.maxJumps;
                  break;
                // checkpoint
                case -5:
                  if (!player.gameComplete) {
                    player.gameComplete = true;
                    player.finalTimePlayed = player.timePlayed;
                    player.finalDeaths = player.deaths;
                    id("endStat").style.display = "inline";
                    id("timePlayedEnd").innerHTML = formatTime(
                      player.finalTimePlayed
                    );
                    id("deathCountEnd").innerHTML = player.finalDeaths;
                    if (id("mainInfo").style.bottom != "0%") openInfo();
					triggerHit("Goal["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  }
                case 3:
                  if (!isSpawn(x, y)) {
                    if (player.currentLevel === 8) {
                      branchInProgress = false;
                      player.reachedHub = true;
                    }
                    player.spawnPoint = [
                      x,
                      y,
                      player.levelCoord[0],
                      player.levelCoord[1],
                      player.g,
                      player.maxJumps,
                      player.moveSpeed,
                      [...player.triggers],
                      currentVersion,
                      player.reachedHub,
                      player.timePlayed,
                      player.deaths,
                      player.gameComplete,
                      player.finalTimePlayed,
                      player.finalDeaths,
                      player.branchTime
                    ];
                    shouldDrawLevel = true;
                    save();
					triggerHit("Checkpoint["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  }
                  break;
                // speed change
                case 21:
				  if (player.moveSpeed != 300)
				  triggerHit("SlowSpeed["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.moveSpeed = 300;
                  break;
                case 22:
				  if (player.moveSpeed != 600)
				  triggerHit("NormalSpeed["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.moveSpeed = 600;
                  break;
                case 23:
				  if (player.moveSpeed != 1200)
				  triggerHit("FastSpeed["+x+","+y+"] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  player.moveSpeed = 1200;
                  break;
                // death block
                case 2:
                case -4:
                  shouldDie = true;
                  break;
                // special
                case -3:
                  if (!player.triggers.includes(props[1]))
                    player.triggers.push(props[1]);
                  if (props[1] < 0) branchInProgress = false;
                  break;
                case -2:
                  if (player.currentLevel === 8) {
                    branchInProgress = true;
                    player.branchTime = 0;
                  }
                  let warpId = props[1];
                  if (bx1 < 0) {
                    // left
                    if (props[2] != undefined) {
                      player.levelCoord[0] += props[2];
                      player.levelCoord[1] += props[3];
                    } else player.levelCoord[0]--;
                    player.x =
                      levels[player.currentLevel].length * blockSize -
                      playerSize;
                    player.y =
                      blockSize *
                        levels[player.currentLevel][
                          levels[player.currentLevel].length - 1
                        ].findIndex((x) => x[0] == -1 && x[1] == warpId) +
                      ((player.y + blockSize) % blockSize);
					triggerHit("Room["+x+","+y+"]<"+player.levelCoord[0]+","+player.levelCoord[1]+"> @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  } else if (bx2 >= level.length) {
                    // right
                    if (props[2] != undefined) {
                      player.levelCoord[0] += props[2];
                      player.levelCoord[1] += props[3];
                    } else player.levelCoord[0]++;
                    player.x = 0;
                    player.y =
                      blockSize *
                        levels[player.currentLevel][0].findIndex(
                          (x) => x[0] == -1 && x[1] == warpId
                        ) +
                      ((player.y + blockSize) % blockSize);
					triggerHit("Room["+x+","+y+"]<"+player.levelCoord[0]+","+player.levelCoord[1]+"> @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  } else if (by1 < 0) {
                    // up
                    if (props[2] != undefined) {
                      player.levelCoord[0] += props[2];
                      player.levelCoord[1] += props[3];
                    } else player.levelCoord[1]++;
                    player.y =
                      levels[player.currentLevel][0].length * blockSize -
                      playerSize;
                    player.x =
                      blockSize *
                        levels[player.currentLevel].findIndex(
                          (x) =>
                            x[x.length - 1][0] == -1 &&
                            x[x.length - 1][1] == warpId
                        ) +
                      ((player.x + blockSize) % blockSize);
					triggerHit("Room["+x+","+y+"]<"+player.levelCoord[0]+","+player.levelCoord[1]+"> @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  } else if (by2 >= level[0].length) {
                    // down
                    if (props[2] != undefined) {
                      player.levelCoord[0] += props[2];
                      player.levelCoord[1] += props[3];
                    } else player.levelCoord[1]--;
                    player.y = 0;
                    player.x =
                      blockSize *
                        levels[player.currentLevel].findIndex(
                          (x) => x[0][0] == -1 && x[0][1] == warpId
                        ) +
                      ((player.x + blockSize) % blockSize);
					triggerHit("Room["+x+","+y+"]<"+player.levelCoord[0]+","+player.levelCoord[1]+"> @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
                  }
                  updateAudio();
                  break;
                default:
                  break;
              }
            }
          }
        }
      }
      if (onFloor) {
        player.currentJumps = player.maxJumps;
      } else if (player.currentJumps === player.maxJumps) player.currentJumps--;
      // die
      if (!player.godMode && shouldDie && !player.isDead) player.isDead = true;
      if (player.isDead) {
        player.spawnTimer -= dt;
        if (player.spawnTimer <= 0) respawn(true, dt, i);
      }
	  if (player.triggers.includes("TAS")) {
		  player.triggers.splice(player.triggers.indexOf("TAS"), 1);
		  TAStrigger = true;
		  if (lastTAStrigger == false)
			triggerHit("TASTrigger @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
	  }
      if (!player.triggers.includes(-1)) {
        levels[9][5][5] = 0;
        levels[9][5][4] = 0;
        levels[9][5][2] = 0;
        levels[9][5][1] = 0;
        levels[9][8][5] = 0;
        levels[9][10][1] = 0;
        levels[9][13][1] = 0;
      } else {
		if (levels[9][5][5] == 0) triggerHit("BranchTrigger[1] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[9][5][5] = 7;
        levels[9][5][4] = 6;
        levels[9][5][2] = 7;
        levels[9][5][1] = 6;
        levels[9][8][5] = 7;
        levels[9][10][1] = 6;
        levels[9][13][1] = 7;
      }
      if (!player.triggers.includes(-2)) {
        levels[9][7][5] = 0;
        levels[9][7][4] = 0;
        levels[9][7][2] = 0;
        levels[9][7][1] = 0;
      } else {
		if (levels[9][7][5] == 0) triggerHit("BranchTrigger[2] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[9][7][5] = 13;
        levels[9][7][4] = 16;
        levels[9][7][2] = 16;
        levels[9][7][1] = 13;
      }
      if (!player.triggers.includes(-3)) {
        levels[9][10][2] = 1;
        levels[9][10][3] = 1;
        levels[9][10][5] = 1;
      } else {
		if (levels[9][10][5] == 1) triggerHit("BranchTrigger[3] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[9][10][2] = 11;
        levels[9][10][3] = 11;
        levels[9][10][5] = 11;
      }
      if (!player.triggers.includes(-4)) {
        levels[9][11][1] = 0;
        levels[9][11][5] = 0;
        levels[9][13][5] = 0;
      } else {
		if (levels[9][11][5] == 0) triggerHit("BranchTrigger[4] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[9][11][1] = 22;
        levels[9][11][5] = 23;
        levels[9][13][5] = 22;
      }
      if (player.triggers.includes(0)) {
		if (levels[22][6][4] == -4) triggerHit("Trigger[0] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[22][6][4] = 0;
      } else levels[22][6][4] = -4;
      if (player.triggers.includes(1)) {
		if (levels[22][6][5] == -4) triggerHit("Trigger[1] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[22][6][5] = 0;
      } else levels[22][6][5] = -4;
      if (player.triggers.includes(2)) {
		if (levels[26][27][1] == -4) triggerHit("Trigger[2] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][27][1] = 0;
        levels[26][27][2] = 0;
      } else {
        levels[26][27][1] = -4;
        levels[26][27][2] = -4;
      }
      if (player.triggers.includes(3)) {
		if (levels[26][28][1] == -4) triggerHit("Trigger[3] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][28][1] = 0;
        levels[26][28][2] = 0;
      } else {
        levels[26][28][1] = -4;
        levels[26][28][2] = -4;
      }
      if (player.triggers.includes(4)) {
		if (levels[26][29][1] == -4) triggerHit("Trigger[4] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][29][1] = 0;
        levels[26][29][2] = 0;
      } else {
        levels[26][29][1] = -4;
        levels[26][29][2] = -4;
      }
      if (player.triggers.includes(5)) {
		if (levels[26][31][11] == -5) triggerHit("Trigger[5] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][31][11] = 0;
        levels[26][31][12] = 0;
      } else {
        levels[26][31][11] = -4;
        levels[26][31][12] = -4;
      }
      if (player.triggers.includes(6)) {
		if (levels[26][32][11] == -4) triggerHit("Trigger[6] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][32][11] = 0;
        levels[26][32][12] = 0;
      } else {
        levels[26][32][11] = -4;
        levels[26][32][12] = -4;
      }
      if (player.triggers.includes(7)) {
		if (levels[26][33][11] == -4) triggerHit("Trigger[7] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][33][11] = 0;
        levels[26][33][12] = 0;
      } else {
        levels[26][33][11] = -4;
        levels[26][33][12] = -4;
      }
      if (player.triggers.includes(8)) {
		if (levels[26][38][1] == -4) triggerHit("Trigger[8] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][38][1] = 0;
      } else levels[26][38][1] = -4;
      if (player.triggers.includes(9)) {
		if (levels[26][39][1] == -4) triggerHit("Trigger[9] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[26][39][1] = 0;
      } else levels[26][39][1] = -4;
      if (player.triggers.includes(10)) {
		if (levels[32][15][3] == -4) triggerHit("Trigger[10] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[32][15][3] = 0;
      } else levels[32][15][3] = -4;
      if (player.triggers.includes(11)) {
		if (levels[32][9][1] == -4) triggerHit("Trigger[11] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[32][9][1] = 0;
      } else levels[32][9][1] = -4;
      if (player.triggers.includes(12)) {
		if (levels[32][7][3] == -4) triggerHit("Trigger[12] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[32][7][3] = 0;
      } else levels[32][7][3] = -4;
      if (player.triggers.includes(13)) {
		if (levels[32][3][3] == -4) triggerHit("Trigger[13] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[32][3][3] = 0;
      } else levels[32][3][3] = -4;
      if (player.triggers.includes(14)) {
		if (levels[32][1][4] == -4) triggerHit("Trigger[14] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[32][1][4] = 0;
      } else levels[32][1][4] = -4;
      if (player.triggers.includes(15)) {
		if (levels[35][15][4] == -4) triggerHit("Trigger[15] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[35][15][4] = 0;
        levels[35][15][5] = 0;
      } else {
        levels[35][15][4] = -4;
        levels[35][15][5] = -4;
      }
      if (player.triggers.includes(16)) {
		if (levels[42][12][9] == -4) triggerHit("Trigger[16] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[42][12][9] = 0;
      } else levels[42][12][9] = -4;
      if (player.triggers.includes(17)) {
		if (levels[42][1][1] == -4) triggerHit("Trigger[17] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[42][1][1] = 0;
      } else levels[42][1][1] = -4;
      if (player.triggers.includes(18)) {
		if (levels[43][10][6] == -4) triggerHit("Trigger[18] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[43][10][6] = 0;
      } else levels[43][10][6] = -4;
      if (player.triggers.includes(19)) {
		if (levels[43][5][9] == -4) triggerHit("Trigger[19] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[43][5][9] = 0;
      } else levels[43][5][9] = -4;
      if (player.triggers.includes(20)) {
		if (levels[43][7][10] == -4) triggerHit("Trigger[20] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[43][7][10] = 0;
        if (diff === "-HARD") levels[43][6][9] = -4;
      } else {
        levels[43][7][10] = -4;
        if (diff === "-HARD") levels[43][6][9] = 0;
      }
      if (player.triggers.includes(21)) {
		if (levels[43][6][12] == -4) triggerHit("Trigger[21] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[43][6][12] = 0;
      } else levels[43][6][12] = -4;
      if (player.triggers.includes(22)) {
		if (levels[52][1][2] == -4) triggerHit("Trigger[22] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[52][1][2] = 0;
      } else levels[52][1][2] = -4;
      if (player.triggers.includes(23)) {
		if (levels[63][27][5] == -4) triggerHit("Trigger[23] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[63][27][5] = 0;
      } else levels[63][27][5] = -4;
      if (player.triggers.includes(24)) {
		if (levels[63][27][2] == -4) triggerHit("Trigger[24] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[63][27][2] = 0;
      } else levels[63][27][2] = -4;
      if (player.triggers.includes(25)) {
		if (levels[63][25][5] == -4) triggerHit("Trigger[25] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[63][25][5] = 0;
      } else levels[63][25][5] = -4;
      if (player.triggers.includes(26)) {
		if (levels[63][25][8] == -4) triggerHit("Trigger[26] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[63][25][8] = 0;
      } else levels[63][25][8] = -4;
      if (player.triggers.includes(27)) {
		if (levels[73][13][4] == -4) triggerHit("Trigger[27] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[73][13][4] = 0;
      } else levels[73][13][4] = -4;
      if (player.triggers.includes(28)) {
		if (levels[73][13][3] == -4) triggerHit("Trigger[28] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[73][13][3] = 0;
      } else levels[73][13][3] = -4;
      if (player.triggers.includes(29)) {
		if (levels[74][4][8] == -4) triggerHit("Trigger[29] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[74][4][8] = 0;
        levels[74][4][9] = 0;
      } else {
        levels[74][4][8] = -4;
        levels[74][4][9] = -4;
      }
      if (player.triggers.includes(30)) {
		if (levels[74][6][4] == -4) triggerHit("Trigger[30] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[74][6][4] = 0;
      } else levels[74][6][4] = -4;
      if (player.triggers.includes(31)) {
		if (levels[74][5][20] == -4) triggerHit("Trigger[31] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[74][5][20] = 0;
      } else levels[74][5][20] = -4;
      if (player.triggers.includes(32)) {
		if (levels[75][5][4] == -4) triggerHit("Trigger[32] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[75][5][4] = 0;
      } else levels[75][5][4] = -4;
      if (player.triggers.includes(33)) {
		if (levels[75][5][2] == -4) triggerHit("Trigger[33] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[75][5][2] = 0;
      } else levels[75][5][2] = -4;
      if (player.triggers.includes(34)) {
		if (levels[75][7][10] == -4) triggerHit("Trigger[34] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[75][7][10] = 0;
      } else levels[75][7][10] = -4;
      if (player.triggers.includes(35)) {
		if (levels[85][16][11] == -4) triggerHit("Trigger[35] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[85][16][11] = 0;
      } else levels[85][16][11] = -4;
      if (player.triggers.includes(36)) {
		if (levels[85][18][11] == -4) triggerHit("Trigger[36] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[85][18][11] = 0;
      } else levels[85][18][11] = -4;
      if (player.triggers.includes(37)) {
		if (levels[85][19][3] == -4) triggerHit("Trigger[37] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[85][19][3] = 0;
      } else levels[85][19][3] = -4;
      if (player.triggers.includes(38)) {
		if (levels[85][19][1] == -4) triggerHit("Trigger[38] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[85][19][1] = 0;
      } else levels[85][19][1] = -4;
      if (player.triggers.includes(39)) {
		if (levels[87][16][11] == -4) triggerHit("Trigger[39] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[87][16][11] = 0;
        levels[87][16][12] = 0;
      } else {
        levels[87][16][11] = -4;
        levels[87][16][12] = -4;
      }
      if (player.triggers.includes(40)) {
		if (levels[87][18][11] == -4) triggerHit("Trigger[40] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[87][18][11] = 0;
        levels[87][18][12] = 0;
      } else {
        levels[87][18][11] = -4;
        levels[87][18][12] = -4;
      }
      if (player.triggers.includes(41)) {
		if (levels[87][20][11] == -4) triggerHit("Trigger[41] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[87][20][11] = 0;
        levels[87][20][12] = 0;
      } else {
        levels[87][20][11] = -4;
        levels[87][20][12] = -4;
      }
      if (player.triggers.includes(42)) {
		if (levels[87][22][11] == -4) triggerHit("Trigger[42] @ "+currentFrame+","+i+" ("+(player.timePlayed/1000+dt*i/1000).toFixed(3)+")");
        levels[87][22][11] = 0;
        levels[87][22][12] = 0;
      } else {
        levels[87][22][11] = -4;
        levels[87][22][12] = -4;
      }
    }
    dt = dt * simReruns;
    // key input
    if (control.left && player.xv > -player.moveSpeed) {
      player.xv -= (player.moveSpeed * dt) / 50 / (noFriction ? 6 : 1);
      if (player.xv < -player.moveSpeed / (noFriction ? 6 : 1))
        player.xv = -player.moveSpeed / (noFriction ? 6 : 1);
    }
    if (control.right && player.xv < player.moveSpeed) {
      player.xv += (player.moveSpeed * dt) / 50 / (noFriction ? 6 : 1);
      if (player.xv > player.moveSpeed / (noFriction ? 6 : 1))
        player.xv = player.moveSpeed / (noFriction ? 6 : 1);
    }
    if (control.up || control.down || control.space) {
      if (player.canWalljump) {
        if (player.wallJumpDir === "left" && control.left) {
          player.canJump = false;
          player.xv = -600;
          player.yv = -Math.sign(player.g) * 205;
        }
        if (player.wallJumpDir === "right" && control.right) {
          player.canJump = false;
          player.xv = 600;
          player.yv = -Math.sign(player.g) * 205;
        }
      } else if (
        player.canJump &&
        (player.currentJumps > 0 || player.godMode)
      ) {
        player.canJump = false;
        player.yv = -Math.sign(player.g) * 205;
        player.currentJumps--;
      }
    }
    // draw checks
    if (player.x != xprev || player.y != yprev) drawPlayer();
    if (
      player.levelCoord[0] !== lvlxprev ||
      player.levelCoord[1] !== lvlyprev ||
      !arraysEqual(player.triggers, triggersPrev) ||
      shouldDrawLevel
    )
      drawLevel();
    if (camx !== lvlx || camy !== lvly)
      adjustScreen(
        player.levelCoord[0] !== lvlxprev || player.levelCoord[1] !== lvlyprev
      );
  }
  //window.requestAnimationFrame(nextFrame);
  updatePlayerPosition(player.x, player.y);
  updatePlayerVelocity(player.xv, player.yv);
}

function openInfo() {
  if (id("mainInfo").style.bottom == "0%") {
    id("mainInfo").style.bottom = "100%";
    id("mainInfo").style.opacity = 0;
  } else {
    id("mainInfo").style.bottom = "0%";
    id("mainInfo").style.opacity = 1;
  }
}
function newSave() {
  return [
    1,
    6,
    0,
    8,
    325,
    1,
    600,
    [],
    currentVersion,
    false,
    0,
    0,
    false,
    0,
    0,
    0
  ];
}
function save() {
  let saveData = deepCopy(player.spawnPoint);
  if (saveData[5] == Infinity) saveData[5] = "Infinity";
  localStorage.setItem("just-a-save" + diff, JSON.stringify(saveData));
}
function load() {
  if (localStorage.getItem("just-a-save" + diff)) {
    let saveData = JSON.parse(localStorage.getItem("just-a-save" + diff));
    if (saveData[5] == "Infinity") saveData[5] = Infinity;
    if (saveData[8] == undefined) {
      saveData[8] = newSave()[8];
      saveData[3] += 3;
    }
    player.spawnPoint = saveData;
    player.timePlayed = player.spawnPoint[10] ?? 0;
    player.deaths = player.spawnPoint[11] ?? 0;
    player.gameComplete = player.spawnPoint[12] ?? false;
    player.finalTimePlayed = player.spawnPoint[13] ?? 0;
    player.finalDeaths = player.spawnPoint[14] ?? 0;
    player.branchTime = player.spawnPoint[15] ?? 0;
    id("timePlayed").innerHTML = formatTime(player.timePlayed);
    id("deathCount").innerHTML = player.deaths;
    if (player.gameComplete) {
      id("endStat").style.display = "inline";
      id("timePlayedEnd").innerHTML = formatTime(player.finalTimePlayed);
      id("deathCountEnd").innerHTML = player.finalDeaths;
    }
    save();
  }
}
function wipeSave() {
  if (
    !options.wipeConfirm ||
    confirm("Are you sure you want to delete your save?")
  ) {
	currentFrame = 0;
	TAS_gameSlowdown = 1/parseFloat(gameSpeedTextbox.value);
	msOfFrame = frameTime*TAS_gameSlowdown/2;
	parseInput(-1);
	clearTriggers();
	TAS = JSON.parse(JSON.stringify(TAS_base));
    player.spawnPoint = newSave();
    save();
    load();
    respawn(false);
    branchInProgress = true;
    drawLevel();
    drawPlayer();
    adjustScreen(true);
  }
}

function forceWipeSave(s) {
	currentFrame = 0;
	TAS_gameSlowdown = 1/parseFloat(gameSpeedTextbox.value);
	msOfFrame = frameTime*TAS_gameSlowdown/2;
	parseInput(-1);
	clearTriggers();
	TAS = JSON.parse(JSON.stringify(TAS_base));
    player.spawnPoint = newSave();
	if (s != "") player.spawnPoint = s;
    save();
    load();
    respawn(false);
    branchInProgress = true;
    drawLevel();
    drawPlayer();
    adjustScreen(true);
}
function exportSave() {
  let saveData = localStorage.getItem("just-a-save" + diff);
  id("exportArea").value = saveData;
  id("exportArea").style.display = "inline";
  id("exportArea").focus();
  id("exportArea").select();
  document.execCommand("copy");
  id("exportArea").style.display = "none";
  alert("Save data copied to clipboard!");
}
function importSave() {
  let saveData = prompt("Please input save data");
  if (saveData) {
	savestate = JSON.parse(saveData);
    localStorage.setItem("just-a-save" + diff, saveData);
    load();
    respawn(false);
    drawLevel();
    drawPlayer();
    adjustScreen(true);
  }
}
function isSpawn(x, y) {
  return (
    player.spawnPoint[2] == player.levelCoord[0] &&
    player.spawnPoint[3] == player.levelCoord[1] &&
    player.spawnPoint[0] == x &&
    player.spawnPoint[1] == y
  );
}
function respawn(death = true, dt=0, i=0) {
  if (death) {
    player.deaths++;
    player.spawnPoint[11] = player.deaths;
    id("deathCount").innerHTML = player.deaths;
    save();
	if (!fromRespawn) triggerHit("Death @ " + currentFrame + "," + i + " (" + (player.timePlayed/1000+dt*i/1000).toFixed(3) + ")");
	else fromRespawn = false;
  }
  player.spawnTimer = player.spawnDelay;
  player.isDead = false;
  player.levelCoord = [player.spawnPoint[2], player.spawnPoint[3]];
  player.xv = 0;
  player.yv = 0;
  player.g = player.spawnPoint[4];
  player.maxJumps = player.spawnPoint[5];
  player.currentJumps = player.maxJumps;
  player.moveSpeed = player.spawnPoint[6];
  player.triggers = [...player.spawnPoint[7]];
  player.reachedHub = player.spawnPoint[9];
  let spawnx = player.spawnPoint[0] * blockSize + (blockSize - playerSize) / 2;
  let spawny = player.spawnPoint[1] * blockSize;
  if (player.g > 0) spawny += blockSize - playerSize;
  player.x = spawnx;
  player.y = spawny;
  drawLevel();
  drawPlayer();
  if (audioInitDone) updateAudio();
}
function getBlockType(x, y) {
  let level = levels[player.currentLevel];
  if (x < 0 || x >= level.length || y < 0 || y >= level[0].length) {
    if (level[x - 1] != undefined) {
      if (typeof level[x - 1][y] == "object") {
        if (level[x - 1][y][0] == -1) {
          return [
            -2,
            level[x - 1][y][1],
            level[x - 1][y][2],
            level[x - 1][y][3]
          ];
        }
      }
    }
    if (level[x + 1] != undefined) {
      if (typeof level[x + 1][y] == "object") {
        if (level[x + 1][y][0] == -1) {
          return [
            -2,
            level[x + 1][y][1],
            level[x + 1][y][2],
            level[x + 1][y][3]
          ];
        }
      }
    }
    if (level[x] != undefined) {
      if (typeof level[x][y - 1] == "object") {
        if (level[x][y - 1][0] == -1) {
          return [
            -2,
            level[x][y - 1][1],
            level[x][y - 1][2],
            level[x][y - 1][3]
          ];
        }
      }
      if (typeof level[x][y + 1] == "object") {
        if (level[x][y + 1][0] == -1) {
          return [
            -2,
            level[x][y + 1][1],
            level[x][y + 1][2],
            level[x][y + 1][3]
          ];
        }
      }
    }
    return 1;
  }
  return level[x][y];
}
function deepCopy(inObject) {
  //definitely not copied from somewhere else
  let outObject, value, key;
  if (typeof inObject !== "object" || inObject === null) {
    return inObject;
  }
  outObject = Array.isArray(inObject) ? [] : {};
  for (key in inObject) {
    value = inObject[key];
    outObject[key] = deepCopy(value);
  }
  return outObject;
}
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
function formatTime(ms, word = true) {
  let s = ms / 1000;
  let ds = s % 60;
  let m = Math.floor(s / 60);
  let dm = m % 60;
  let h = Math.floor(m / 60);
  let dh = h % 24;
  let d = Math.floor(h / 24);
  let dd = d % 30.43685;
  let mo = Math.floor(d / 30.43685);
  let dmo = mo % 12;
  let dy = Math.floor(mo / 365.2422);
  let time = "";
  if (word) {
    if (s < 60) {
      time = ds.toFixed(3) + " second" + pluralCheck(ds);
    } else {
      time = "and " + ds.toFixed(3) + " second" + pluralCheck(ds);
    }
    if (dm >= 1) time = dm + " minute" + pluralCheck(dm) + ", " + time;
    if (dh >= 1) time = dh + " hour" + pluralCheck(dh) + ", " + time;
    if (dd >= 1) time = dd + " day" + pluralCheck(dd) + ", " + time;
    if (dmo >= 1) time = dmo + " month" + pluralCheck(dmo) + ", " + time;
    if (dy >= 1) time = dy + " year" + pluralCheck(dy) + ", " + time;
    if (m < 60) time = time.replace(",", "");
    return time;
  } else {
    time = (ds < 9.999 ? "0" : "") + ds.toFixed(3);
    time = dm + ":" + time;
    if (dh >= 1) time = dh + ":" + time;
    if (dd >= 1) time = dd + "d " + time;
    if (dmo >= 1) time = dmo + "m " + time;
    if (dy >= 1) time = dy + "y " + time;
    return time;
  }
}
function pluralCheck(n) {
  return n === 1 ? "" : "s";
}
var id = (x) => document.getElementById(x);

function parseInput(f) {
	if (TAS.length > 0) {
	if (TAS[0][0] == f) {
		if (TAS[0].length == 4) {
			//triggers
			if (TAS[0][1] == "trigger") {
				triggerBlocksToReplace.push([player.currentLevel, parseInt(TAS[0][2]), parseInt(TAS[0][3]), levels[player.currentLevel][parseInt(TAS[0][2])][parseInt(TAS[0][3])]]);
				levels[player.currentLevel][parseInt(TAS[0][2])][parseInt(TAS[0][3])] = [-3, "TAS"];
				drawLevel();
			}
			//loadstates
			else if (TAS[0][1] == "loadstate") {
				if (TAS[0][2] == "game") player.spawnPoint = JSON.parse(TAS[0][3]);
				else if (TAS[0][2] == "player") {
					loadstate = JSON.parse(TAS[0][3]);
					player.x = loadstate[0];
					player.y = loadstate[1];
					player.xv = loadstate[2];
					player.yv = loadstate[3];
				}
			}
		}
		if (TAS[0].length == 3) {
			// directional inputs
			if (TAS[0][2] == "up") {
				if (TAS[0][1] == "rel") {
					control.up = false;	
					if (!control.down && !control.space) player.canJump = true;
				} else if (TAS[0][1] == "press") control.up = true;
			} else if (TAS[0][2] == "right") {
				if (TAS[0][1] == "rel") control.right = false;
				else if (TAS[0][1] == "press") control.right = true;
				else if (TAS[0][1] == "move") {
					control.right = true;
					control.left = false;
				}
			} else if (TAS[0][2] == "left") {
				if (TAS[0][1] == "rel") control.left = false;
				else if (TAS[0][1] == "press") control.left = true;
				else if (TAS[0][1] == "move") {
					control.left = true;
					control.right = false;
				}
			//savestates
			} else if (TAS[0][1] == "savestate") {
				if (TAS[0][2] == "game") navigator.clipboard.writeText(JSON.stringify(player.spawnPoint));
				else if (TAS[0][2] == "player") navigator.clipboard.writeText(JSON.stringify([player.x,player.y,player.xv,player.yv]));
			}
		} else {
			if (TAS[0][1] == "jump") {
				// Works like releasing and then pressing up.
				control.up = true;
				player.canJump = true;
			} else if (TAS[0][1] == "respawn") {
				player.isDead = true;
				player.spawnTimer = 0;
				fromRespawn = true;
			} else if (TAS[0][1] == "reset") {
				f = 0;
				currentFrame = 0;
				control.up = false;
				control.left = false;
				control.right = false;
				player.canJump = false;
			} else if (TAS[0][1] == "hub") {
				if (player.reachedHub) {
					player.spawnPoint = [
					  7,
					  5,
					  5,
					  4,
					  325,
					  1,
					  600,
					  [...player.triggers],
					  currentVersion,
					  true,
					  player.timePlayed,
					  player.deaths,
					  player.gameComplete,
					  player.finalTimePlayed,
					  player.finalDeaths,
					  0
					];
					fromRespawn = true;
					respawn();
				}
			} else if (TAS[0][1] == "stop") {
				gameRunning = false;
			}
		}
		TAS.shift();
		parseInput(f);
	}
	for (const i of findIndices(TAS, f+1)) {
		if (TAS[i].length == 3 && TAS[i][1] == "frameTime" && gameRunning == true) {
			frameTime = parseFloat(TAS[i][2]);
			TAS.shift();
			parseInput(f);
		}
		if (TAS[i].length == 3 && TAS[i][1] == "FPS" && gameRunning == true) {
			frameTime = 1000/parseFloat(TAS[i][2]);
			TAS.shift();
			parseInput(f);
		}
		if (TAS[i].length == 3 && TAS[i][1] == "slowdown" && gameRunning == true) {
			TAS_gameSlowdown = parseFloat(TAS[i][2]);
			gameSpeedTextbox.value = (1/TAS_gameSlowdown).toFixed(2);
			gameSpeedSlider.value = Math.log10(1/TAS_gameSlowdown).toFixed(2);
			TAS.shift();
			parseInput(f);
		}
		if (TAS[i].length == 3 && TAS[i][1] == "speed" && gameRunning == true) {
			TAS_gameSlowdown = 1/parseFloat(TAS[i][2]);
			gameSpeedTextbox.value = (1/TAS_gameSlowdown).toFixed(2);
			gameSpeedSlider.value = Math.log10(1/TAS_gameSlowdown).toFixed(2);
			TAS.shift();
			parseInput(f);
		}
	}
}}

function findIndices(arr, x) {
  const indices = [];
  indloop:
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][0] === x) {
      indices.push(i);
    }
	if (arr[i][1] == "reset") {
	  break indloop;
	}
  }
  
  return indices;
} //Small little ChatGPT wrapper function

var start;
var msOfFrame = frameTime*TAS_gameSlowdown/2; //Helps keep it balanced at the start

function frameWrapper(timestamp) {
	if (start == undefined) start = timestamp;
	const elapsed = timestamp - start;
	start = timestamp;
	if (gameRunning) {
		msOfFrame += elapsed;
		while (msOfFrame >= frameTime*TAS_gameSlowdown) {
			msOfFrame -= frameTime*TAS_gameSlowdown;
			nextFrame();
		}
	}
	window.requestAnimationFrame(frameWrapper)
}
window.requestAnimationFrame(frameWrapper);

var TAS = "";//window.prompt("Enter the raw text of the TAS here.").replace(/(\r\n|\n|\r)/gm, "").split("; ").filter(a => !a.includes("#"));
var TAS_base = "";
var TAS_str = "";
/*TAS.pop();
for (var i = 0; i < TAS.length; i++) {
	TAS[i] = TAS[i].split(" ");
	TAS[i][0] = parseInt(TAS[i][0]);
}
var TAS_base = JSON.parse(JSON.stringify(TAS));*/
/*savestate = window.prompt("Enter the savestate (leave blank if fresh)");
if (savestate != "") savestate = JSON.parse(savestate);*/

var currentFrame = 0;
load();
respawn(false);
adjustScreen(true);

//window.requestAnimationFrame(nextFrame);
parseInput(-1);	
setTimeout(drawLevel, 100);
var modal;
var closeBtn;
var tasInput;
var saveTasBtn;
var gameRunning = false;
var firstTime = true;
window.onload = function(){
modal = document.getElementById('edit-tas-modal');

// get the <span> element that closes the modal
closeBtn = document.getElementById('close');

// get the <textarea> element for the TAS input
tasInput = document.getElementById('tas-input');

// get the <button> element for the save button
saveTasBtn = document.getElementById('save-tas-btn');

// update the tas variable and hide the modal when the save button is clicked
saveTasBtn.addEventListener('click', function() {
	firstTime = false;
	 modal.classList.remove("fade-in");
	modal.classList.add("fade-out");
	setTimeout(function() {
    modal.style.display = "none";
    modal.classList.remove("fade-out");
	}, 450);
	gameRunning = false;
	setTimeout(function() {
	TAS_str = tasInput.value;
	TAS = TAS_str.split("\n").filter(a => !a.includes("#"));
	for (var i = 0; i < TAS.length; i++) {
		TAS[i] = TAS[i].split(" ");
		TAS[i][0] = parseInt(TAS[i][0]);
	}
	TAS_base = JSON.parse(JSON.stringify(TAS));
	currentFrame = 0;
	TAS_gameSlowdown = 1;
	for (var i = 0; i < triggerBlocksToReplace.length; i++)
		levels[triggerBlocksToReplace[i][0]][triggerBlocksToReplace[i][1]][triggerBlocksToReplace[i][2]] = triggerBlocksToReplace[i][3];
	triggerBlocksToReplace = [];
	msOfFrame = frameTime*TAS_gameSlowdown/2;
	parseInput(-1);
	clearTriggers();
	gameRunning = true;
	forceWipeSave(savestate);
	}, 500);
});

// hide the modal when the close button or outside the modal is clicked
closeBtn.addEventListener('click', function() {
   modal.classList.remove("fade-in");
	modal.classList.add("fade-out");
	setTimeout(function() {
    modal.style.display = "none";
    modal.classList.remove("fade-out");
	}, 450);
	gameRunning = false;
	if (firstTime) {forceWipeSave(savestate); firstTime = false;};
	setTimeout(function() {
	gameRunning = true;
	}, 500);
});

window.addEventListener('click', function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
});}

// Player position update function (example)
function updatePlayerPosition(x, y) {
  const playerPosition = document.getElementById('player-position');
  playerPosition.textContent = `[${x.toFixed(3)}, ${y.toFixed(3)}]`;
}


// Player velocity update function (example)
function updatePlayerVelocity(xv, yv) {
  const playerVelocity = document.getElementById('player-velocity');
  playerVelocity.textContent = `[${xv.toFixed(3)}, ${yv.toFixed(3)}]`;
}

// Function to add a trigger message
function triggerHit(message) {
  const triggerBox = document.getElementById('trigger-box');
  if (triggerBox.innerHTML != "") triggerBox.innerHTML += "\n";
  triggerBox.innerHTML += message;
  triggerBox.scrollTop = triggerBox.scrollHeight;
}

// Function to clear trigger messages
function clearTriggers() {
  const triggerBox = document.getElementById('trigger-box');
  triggerBox.innerHTML = '';
}

// Smoothly toggle the TAS menu visibility
const tasBar = document.querySelector('.tas-bar');
const tasMenu = document.querySelector('.tas-menu');
const tasSettings = document.querySelector('.tas-settings');
const triggerBox = document.getElementById('trigger-box');
let menuOpen = false;

tasBar.addEventListener('click', () => {
  if (!menuOpen) {
    tasSettings.classList.add('open');
  } else {
    tasSettings.classList.remove('open');
  }

  menuOpen = !menuOpen;
});

// Existing JavaScript code

const gameSpeedSlider = document.getElementById('game-speed-slider');
const gameSpeedTextbox = document.getElementById('game-speed-textbox');

// Update textbox value based on slider value
gameSpeedSlider.addEventListener('input', () => {
  const sliderValue = parseFloat(gameSpeedSlider.value);
  const snappedValue = Math.abs(sliderValue) <= 0.1 ? 1 : Math.pow(10, sliderValue);
  gameSpeedTextbox.value = snappedValue.toFixed(2);
  gameSpeedSlider.value = Math.log10(snappedValue).toFixed(2);
  TAS_gameSlowdown = 1/snappedValue;
});

// Update slider value based on textbox value
gameSpeedTextbox.addEventListener('input', () => {
  const textboxValue = parseFloat(gameSpeedTextbox.value);
  const snappedValue = Math.log10(textboxValue);
  gameSpeedSlider.value = snappedValue.toFixed(2);
  TAS_gameSlowdown = 1/textboxValue;
});
