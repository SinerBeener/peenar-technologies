let socket;
let clientId = null;
let clientCount = 0;
let clientInfoElem;

let prevX = null, prevY = null;

let canvasWidth, canvasHeight;
const zoneCount = 4;
let zoneHeight;

let drawingLayer;

// Overlay + Animation
let showOverlays = true;
let revealProgress = 0;
let revealing = false;
const revealSpeed = 0.02;

function setup() {
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
  zoneHeight = canvasHeight / zoneCount;

  createCanvas(canvasWidth, canvasHeight);

  drawingLayer = createGraphics(canvasWidth, canvasHeight);
  drawingLayer.background(255);
  drawingLayer.strokeWeight(2);

  strokeWeight(2);
  clientInfoElem = document.getElementById('clientInfo');

  socket = new WebSocket("wss://nosch.uber.space/web-rooms/");

  socket.addEventListener("open", () => {
    sendMsg("*enter-room*", "cadavre-exquis");
    sendMsg("*subscribe-client-count*");
    console.log("Verbunden mit WebSocket");
  });

  socket.addEventListener("message", (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    const type = msg[0];

    if (type === "*client-id*") {
      clientId = msg[1];
      updateInfo();
    }

    if (type === "*client-count*") {
      clientCount = msg[1];
      updateInfo();
    }

    if (type === "draw-line") {
      const sender = msg[1];
      const [x1, y1] = msg[2];
      const [x2, y2] = msg[3];

      if (sender === clientId) return;

      drawingLayer.stroke('red');
      drawingLayer.line(x1, y1, x2, y2);
    }
  });

  const revealBtn = document.getElementById('revealBtn');
  revealBtn.addEventListener('click', () => {
    revealing = true;
  });
}

function draw() {
  image(drawingLayer, 0, 0);

  stroke(180);
  for (let i = 1; i < zoneCount; i++) {
    line(0, i * zoneHeight, canvasWidth, i * zoneHeight);
  }

  if ((showOverlays || revealing) && clientId !== null) {
    noStroke();
    fill('#00ACE6');


    for (let i = 0; i < zoneCount; i++) {
      if (i !== clientId) {
        const y = i * zoneHeight;
        let visibleHeight = zoneHeight;

        if (revealing) {
          visibleHeight = zoneHeight * (1 - revealProgress);
        }

        rect(0, y, canvasWidth, visibleHeight);
      }
    }

    if (revealing) {
      revealProgress += revealSpeed;
      if (revealProgress >= 1) {
        revealProgress = 1;
        showOverlays = false;
        revealing = false;
      }
    }
  }
}

function updateInfo() {
  if (clientId !== null && clientCount > 0) {
    clientInfoElem.textContent = `Du bist Client #${clientId + 1} von ${clientCount}`;
  }
}

function mouseDragged() {
  drawInput(mouseX, mouseY);
}

function touchMoved() {
  drawInput(touchX, touchY);
  return false;
}

function drawInput(x, y) {
  if (clientId === null || !showOverlays) return;

  const zoneTop = clientId * zoneHeight;
  const zoneBottom = zoneTop + zoneHeight;

  if (y < zoneTop || y > zoneBottom) return;

  if (prevX !== null && prevY !== null) {
    drawingLayer.stroke('black');
    drawingLayer.line(prevX, prevY, x, y);

    const message = ["draw-line", clientId, [prevX, prevY], [x, y]];
    sendMsg("*broadcast-message*", message);
  }

  prevX = x;
  prevY = y;
}

function mouseReleased() {
  prevX = null;
  prevY = null;
}

function touchEnded() {
  prevX = null;
  prevY = null;
}

function sendMsg(...message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function windowResized() {
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
  zoneHeight = canvasHeight / zoneCount;

  resizeCanvas(canvasWidth, canvasHeight);

  const newLayer = createGraphics(canvasWidth, canvasHeight);
  newLayer.image(drawingLayer, 0, 0, canvasWidth, canvasHeight);
  drawingLayer = newLayer;
}
