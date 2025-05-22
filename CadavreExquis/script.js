const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let paths = [];
let currentPath = [];
let clientId = null;
let clientCount = 0;

const webRoomsWebSocketServerAddr = 'wss://nosch.uber.space/web-rooms/';
const socket = new WebSocket(webRoomsWebSocketServerAddr);

function sendRequest(...message) {
  socket.send(JSON.stringify(message));
}

// Handle incoming WebSocket messages
socket.addEventListener('open', () => {
  sendRequest('*enter-room*', 'cadavre-exquis');
  sendRequest('*subscribe-client-count*');
  setInterval(() => socket.send(''), 30000); // Keep connection alive
});

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  currentPath = [];
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.lineTo(x, y);
  ctx.stroke();
  currentPath.push({ x, y });
});

canvas.addEventListener("mouseup", () => {
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
