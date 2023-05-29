import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';


const app = express();
const server = http.createServer(app);

import {
    instruction, revaluatePrompt, do_one_item,
    sendQuery,
    send_instruction,
    data,
    notGeneratedLabels,
    history as hst,
    saveHistory

} from './api.mjs';

// Increase file size limit to 50MB
app.use(bodyParser.json({ limit: '350mb' }));
app.use(bodyParser.urlencoded({ limit: '350mb', extended: true }));


var history = hst;
const io = new Server(server, {
    maxHttpBufferSize: 1e9,
});

// Queue of Prompts
const promptQueue = [];
let isTaskRunning = false;

io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('getHistory', () => {
        console.log("sending history", Object.keys(history).length)
        socket.emit('history', history);
    });

    // Start task event
    socket.on('startTask', () => {
        // Implement your logic to start the task
        // You can call your existing `start_task()` function here
        console.log('Starting task');
        isTaskRunning = true;
    });

    // Stop task event
    socket.on('stopTask', () => {
        // Implement your logic to stop the task
        // You can use a flag or variable to control the task execution
        isTaskRunning = false;
    });

    // jsonData is history, save it to file
    socket.on('saveHistory', (message) => {
        console.log('saving history')
        console.log("saving history", Object.keys(message).length)
        history = message;
        // history = message;
        // save history to file
        // saveHistory(jsonData);
    });

    // Custom message event
    socket.on('customMessage', (message) => {
        console.log('Custom message received', message);
        // Implement your logic to handle the custom message
        // You can append the message to the history and process it
        // You may need to modify your existing functions to accommodate this feature
    });

    // Send server status event
    setInterval(() => {
        // Emit server status to the client
        socket.emit('serverStatus', {
            isTaskRunning: false, // Replace with the actual flag/variable that indicates the task status
        });
    }, 1000);
});


const port = 3003;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
