let port;
let reader;
let readableStreamClosed;

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const sendBtn = document.getElementById('sendBtn');
const commandInput = document.getElementById('commandInput');
const outputDiv = document.getElementById('output');
const controlButtons = document.querySelectorAll('.controlBtn');
const rageBtn = document.getElementById('rageBtn');

connectBtn.addEventListener('click', async () => {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        const textDecoder = new TextDecoderStream();
        readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        readData();

        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        sendBtn.disabled = false;

        logMessage('Conectado ao ESP32');
    } catch (error) {
        logMessage(`Erro ao conectar: ${error}`);
    }
});

disconnectBtn.addEventListener('click', async () => {
    try {
        if (reader) {
            await reader.cancel();
            await readableStreamClosed.catch(() => {});
            reader = null;
        }

        if (port) {
            await port.close();
            port = null;
        }

        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        sendBtn.disabled = true;

        logMessage('Desconectado do ESP32');
    } catch (error) {
        logMessage(`Erro ao desconectar: ${error}`);
    }
});

sendBtn.addEventListener('click', async () => {
    if (!port || !commandInput.value) return;
    sendCommand(commandInput.value);
    commandInput.value = '';
});

controlButtons.forEach(button => {
    button.addEventListener('click', () => {
        const command = button.getAttribute('data-command');
        sendCommand(command);
    });
});

rageBtn.addEventListener('click', () => {
    const isRage = rageBtn.classList.toggle('rage');
    rageBtn.textContent = isRage ? '🔴 Rage Mode Ativado' : '⚪ Paz';
    sendCommand(isRage ? 'led_red' : 'led_white');
});

async function sendCommand(command) {
    try {
        const writer = port.writable.getWriter();
        await writer.write(new TextEncoder().encode(command + '\n'));
        writer.releaseLock();
        logMessage(`Enviado: ${command}`);
    } catch (error) {
        logMessage(`Erro ao enviar: ${error}`);
    }
}

async function readData() {
    try {
        while (true && reader) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            if (value) {
                logMessage(`Recebido: ${value}`);
            }
        }
    } catch (error) {
        logMessage(`Erro na leitura: ${error}`);
    }
}

function logMessage(message) {
    outputDiv.innerHTML += `${new Date().toLocaleTimeString()}: ${message}<br>`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
}