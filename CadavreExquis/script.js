let socket;
let clientId = null;
let clientCount = 0;
let clientInfoElem;

let prevX = null, prevY = null;

const canvasWidth = 800;
const canvasHeight = 1200;
const zoneCount = 4;
const zoneHeight = canvasHeight / zoneCount;

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  background(255);
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

      stroke('red');
      line(x1, y1, x2, y2);
    }
  });
}

function draw() {
  // Linien zur Trennung der Zonen
  stroke(180);
  for (let i = 1; i < zoneCount; i++) {
    line(0, i * zoneHeight, canvasWidth, i * zoneHeight);
  }
}

function updateInfo() {
  if (clientId !== null && clientCount > 0) {
    clientInfoElem.textContent = `Du bist Client #${clientId + 1} von ${clientCount}`;
  }
}

function mouseDragged() {
  // Zeichnen nur in erlaubter Zone
  if (clientId === null) return;

  const zoneTop = clientId * zoneHeight;
  const zoneBottom = zoneTop + zoneHeight;

  if (mouseY < zoneTop || mouseY > zoneBottom) return;

  if (prevX !== null && prevY !== null) {
    stroke('black');
    line(prevX, prevY, mouseX, mouseY);

    const message = ["draw-line", clientId, [prevX, prevY], [mouseX, mouseY]];
    sendMsg("*broadcast-message*", message);
  }

  prevX = mouseX;
  prevY = mouseY;
}

function mouseReleased() {
  prevX = null;
  prevY = null;
}

function sendMsg(...message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
