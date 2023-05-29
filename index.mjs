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

    socket.on('sendManualInstruction', (message) => {
        console.log('Manual instruction received', message);
        // Implement your logic to handle the custom message

        try {
            const { tweetId, manualInstruction } = message;

            // find the last prompt of the tweet
            const lastPrompt = history[tweetId].history[history[tweetId].history.length - 1];
            // add to queue
            promptQueue.push({
                'type': 'manual',
                'tweetId': tweetId,
                'lastPrompt': lastPrompt,
                'manualInstruction': manualInstruction
            })

            // send status to client that it is added to queue
            socket.emit('manualInstructionStatus', {
                'status': 'added to queue'
            });

        }
        catch (e) {
            console.log(e);
        }


    });

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

async function runTask() {

    // if queue is empty, return
    if (promptQueue.length == 0) {
        setTimeout(runTask, 1000);
        return;
    }
    // pop from queue
    const prompt = promptQueue.shift();
    console.log("prompt", prompt);


    console.log('sending prompt', prompt)

    // if prompt is manual, sendQuery
    if (prompt.type == 'manual') {

        try {

            let res = await sendQuery(prompt.manualInstruction, prompt.lastPrompt);
            console.log("res", res);

            res.parsedOutput = JSON.parse(res.text);
            // add to history
            history[prompt.tweetId].history.push(res);

            // save history to file
            await saveHistory(history);
            console.log("history saved");

            io.emit('history', history); // send to clients history changed
        }
        catch (e) {
            console.log(e);
        }
        // socket.emit('history', history); // send to clients history changed

        // send to clients history changed
    }

    // run same function every 1 second
    setTimeout(runTask, 1000);
}



const port = 3003;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

runTask();