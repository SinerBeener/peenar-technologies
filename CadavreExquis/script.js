let socket;
let clientId = null;
let clientCount = 0;
let clientInfoElem;

let prevX = null, prevY = null;

function setup() {
  createCanvas(800, 600);
  background(255);
  strokeWeight(2);
  clientInfoElem = document.getElementById('clientInfo');

  socket = new WebSocket("wss://nosch.uber.space/web-rooms/");

  socket.addEventListener("open", () => {
    sendMsg("*enter-room*", "p5-shared-draw-room");
    sendMsg("*subscribe-client-count*");
    console.log("WS connected");
  });

  socket.addEventListener("message", (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
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
      const [sender, from, to] = [msg[1], msg[2], msg[3]];
      if (sender === clientId) return;
      stroke('red');
      line(from[0], from[1], to[0], to[1]);
    }
  });
}

function updateInfo() {
  if (clientId !== null && clientCount > 0) {
    clientInfoElem.textContent = `Du bist Client #${clientId + 1} von ${clientCount}`;
  }
}

function mouseDragged() {
  const x = mouseX, y = mouseY;
  if (prevX !== null && prevY !== null) {
    stroke('black');
    line(prevX, prevY, x, y);

    sendMsg("draw-line", clientId, [prevX, prevY], [x, y]);
  }
  prevX = x; prevY = y;
}

function mouseReleased() {
  prevX = prevY = null;
}

function sendMsg(...parts) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(parts));
  }
}
