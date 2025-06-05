const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const indexElem = document.getElementById('client-index');
let drawing = false;
let paths = [];
let currentPath = [];

// address of the WebSocket server
const webRoomsWebSocketServerAddr = 'https://nosch.uber.space/web-rooms/';

let clientId = null; // client ID sent by web-rooms server when calling 'enter-room'
let clientCount = 0; // number of clients connected to the same room

//Malen
canvas.addEventListener("ontouchstart", (e) => {
  drawing = true;
  currentPath = [];
  ctx.beginPath();
});

canvas.addEventListener("ontouchmove", (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.lineTo(x, y);
  ctx.stroke();
  currentPath.push({ x, y });
});

canvas.addEventListener("ontouchend", () => {
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
  sendRequest('*enter-room*', 'cadavre-expuis');
  sendRequest('*subscribe-client-count*');

  // ping the server regularly with an empty message to prevent the socket from closing
  setInterval(() => socket.send(''), 30000);
});

socket.addEventListener("close", (event) => {
  clientId = null;
  document.body.classList.add('disconnected');
  sendRequest('*broadcast-message*', ['end', clientId]);x
});

// listen to messages from server
socket.addEventListener('message', (event) => {
  const data = event.data;

  if (data.length > 0) {
    const incoming = JSON.parse(data);
    const selector = incoming[0];

    // dispatch incomming messages
    switch (selector) {
      case '*client-id*':
        clientId = incoming[1] + 1;
        indexElem.innerHTML = `#${clientId}/${clientCount}`;
        break;

      case '*client-count*':
        clientCount = incoming[1];
        indexElem.innerHTML = `#${clientId}/${clientCount}`;
        break;

      case 'start': {
        const id = incoming[1];
        const x = incoming[2];
        const y = incoming[3];
        createTouch(id, x, y);
        break;
      }

      case 'move': {
        const id = incoming[1];
        const x = incoming[2];
        const y = incoming[3];
        moveTouch(id, x, y);
        break;
      }

      case 'end': {
        const id = incoming[1];
        deleteTouch(id);
        break;
      }

      case '*error*': {
        const message = incoming[1];
        console.warn('server error:', ...message);
        break;
      }

      default:
        break;
    }
  }
});

function setErrorMessage(text) {
  messageElem.innerText = text;
  messageElem.classList.add('error');
}

function sendRequest(...message) {
  const str = JSON.stringify(message);
  socket.send(str);
}
