const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let paths = [];
let currentPath = [];

// address of the WebSocket server
const webRoomsWebSocketServerAddr = 'https://nosch.uber.space/web-rooms/';

let clientId = null; // client ID sent by web-rooms server when calling 'enter-room'
let clientCount = 0; // number of clients connected to the same room

//Malen
canvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  currentPath = [];
  ctx.beginPath();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.lineTo(x, y);
  ctx.stroke();
  currentPath.push({ x, y });
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
  paths.push(currentPath);
});

document.getElementById("undo").addEventListener("click", () => {
  if (paths.length > 0) {
    paths.pop();
    redraw();
  }
});

document.getElementById("submit").addEventListener("click", () => {
  // Temporär: exportiere Zeichnung als Bild
  const dataURL = canvas.toDataURL();
  console.log("SENDEN:", dataURL);
  // ➜ Hier würdest du via WebSocket die Daten an den Server schicken
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let path of paths) {
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  }
}

/****************************************************************
 * websocket communication
 */
const socket = new WebSocket(webRoomsWebSocketServerAddr);

// listen to opening websocket connections
socket.addEventListener('open', (event) => {
  // ping the server regularly with an empty message to prevent the socket from closing
  setInterval(() => socket.send(''), 30000);
});

socket.addEventListener("close", (event) => {
  clientId = null;
  document.body.classList.add('disconnected');
});

// listen to messages from server
socket.addEventListener('message', (event) => {
  const data = event.data;

  if (data.length > 0) {
    const incoming = JSON.parse(data);
    const selector = incoming[0];

    // dispatch incomming messages
    switch (selector) {
      // responds to '*enter-room*'
      case '*client-id*':
        clientId = incoming[1];
        clientDisplay.innerHTML = `#${clientId}/${clientCount}`;
        break;

      // responds to '*subscribe-client-count*'
      case '*client-count*':
        clientCount = incoming[1];
        clientDisplay.innerHTML = `#${clientId}/${clientCount}`;
        break;
