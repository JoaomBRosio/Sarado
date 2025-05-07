/* filepath: c:\Users\pc\Desktop\animatronic\script.js */
let port;
let reader;
let readableStreamClosed;

// Elementos da interface
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const sendBtn = document.getElementById('sendBtn');
const commandInput = document.getElementById('commandInput');
const outputDiv = document.getElementById('output');

// Conectar ao dispositivo serial
connectBtn.addEventListener('click', async () => {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 }); // Ajuste a taxa de transmissão conforme necessário

        // Configurar leitor
        const textDecoder = new TextDecoderStream();
        readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        // Ler dados continuamente
        readData();

        // Atualizar interface
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        sendBtn.disabled = false;

        logMessage('Conectado ao ESP32');
    } catch (error) {
        logMessage(`Erro ao conectar: ${error}`);
    }
});

// Desconectar
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

// Enviar comando
sendBtn.addEventListener('click', async () => {
    if (!port || !commandInput.value) return;

    try {
        const writer = port.writable.getWriter();
        await writer.write(new TextEncoder().encode(commandInput.value + '\n')); // Adiciona quebra de linha
        writer.releaseLock();
        logMessage(`Enviado: ${commandInput.value}`);
        commandInput.value = '';
    } catch (error) {
        logMessage(`Erro ao enviar: ${error}`);
    }
});

// Ler dados do ESP32
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

// Exibir mensagens na interface
function logMessage(message) {
    outputDiv.innerHTML += `${new Date().toLocaleTimeString()}: ${message}<br>`;
    outputDiv.scrollTop = outputDiv.scrollHeight;
}