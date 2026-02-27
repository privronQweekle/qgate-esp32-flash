const BAUD_RATE = 115200;

let port = null;
let reader = null;
let readLoopRunning = false;

const connectBtn    = document.getElementById('log-connect');
const disconnectBtn = document.getElementById('log-disconnect');
const clearBtn      = document.getElementById('log-clear');
const terminal      = document.getElementById('log-terminal');
const statusDot     = document.getElementById('log-status-dot');
const statusText    = document.getElementById('log-status-text');

function setConnected(connected) {
  connectBtn.hidden    = connected;
  disconnectBtn.hidden = !connected;
  statusDot.className  = 'status-dot ' + (connected ? 'connected' : '');
  statusText.textContent = connected ? 'Connecté — 115200 baud' : 'Déconnecté';
}

function appendLine(text) {
  const atBottom = terminal.scrollHeight - terminal.scrollTop <= terminal.clientHeight + 4;
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = text;
  terminal.appendChild(line);
  if (atBottom) terminal.scrollTop = terminal.scrollHeight;
}

clearBtn.addEventListener('click', () => {
  terminal.innerHTML = '';
});

connectBtn.addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: BAUD_RATE });
    setConnected(true);
    appendLine('▶ Port ouvert à ' + BAUD_RATE + ' baud');
    readLoop();
  } catch (err) {
    if (err.name !== 'NotFoundError') {
      appendLine('✖ Erreur : ' + err.message);
    }
  }
});

disconnectBtn.addEventListener('click', async () => {
  await disconnect();
});

async function readLoop() {
  readLoopRunning = true;
  const decoder = new TextDecoderStream();
  port.readable.pipeTo(decoder.writable);
  reader = decoder.readable.getReader();

  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line
      for (const line of lines) {
        if (line.trim()) appendLine(line.replace(/\r$/, ''));
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      appendLine('✖ Lecture interrompue : ' + err.message);
    }
  } finally {
    readLoopRunning = false;
    setConnected(false);
    appendLine('■ Port fermé');
  }
}

async function disconnect() {
  try {
    if (reader) {
      await reader.cancel();
      reader = null;
    }
    if (port) {
      await port.close();
      port = null;
    }
  } catch {
    // ignore close errors
  }
  setConnected(false);
}
