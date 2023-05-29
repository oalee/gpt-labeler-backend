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

            // save promptQueue to file
            // savePromptQueue(promptQueue);

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

        // check if 

    });

    socket.on('addSampleQueue', () => {

        console.log("adding sample queue")
        // filter data where data.id is not in history
        // somehow, doesn't work
        // console.log("history", history.items[0]);
        // console.log("promptQueue", promptQueue);
        // console.log("data", data[0]);
        // console.log(Object.keys(history).includes(data[0].id));
        // console.log(Object.keys(history));
        let filteredData = data.filter(d => !Object.keys(history).includes(d.id.toString()));

        // also not in promptQueue, type is sampleQueue and item.id is d.id
        filteredData = filteredData.filter(d => !promptQueue.some(p => p.type == 'sampleQueue' && p.item.id == d.id));

        // make prompts with filteredData, item will be filteredData[i], type will be sampleQueue
        let prompts = filteredData.map(item => {
            return {
                'type': 'sampleQueue',
                'item': item
            }
        });
        // add prompts to promptQueue
        promptQueue.push(...prompts);

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
    // setInterval(() => {
    //     // Emit server status to the client
    //     socket.emit('serverStatus', {
    //         isTaskRunning: false, // Replace with the actual flag/variable that indicates the task status
    //     });
    // }, 1000);
});

var rateLimitError = false;
var rateLimitTime = 0;
var error = null

async function runTask() {

    // first send status to clients
    let states = {
        'isTaskRunning': isTaskRunning,
        'promptQueueLength': promptQueue.length,
        'rateLimitError': rateLimitError,
        'rateLimitTime': rateLimitTime,
        'error': error
    };

    io.emit('serverStatus', states);

    // if task is not running, return
    if (!isTaskRunning) {
        setTimeout(runTask, 1000);
        return;
    }

    // if rate limit error, and time is less than 1hr, return


    // if queue is empty, return
    if (promptQueue.length == 0) {
        setTimeout(runTask, 1000);
        return;
    }
    // pop last prompt
    const prompt = promptQueue.pop();
    // console.log("prompt", prompt);


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
            error = e;

            // if e.statusCode == 400, then it is rate limit error
            if (e.statusCode == 400) {
                rateLimitError = true;
                // get time
                rateLimitTime = new Date().getTime();

                // send status to clients
                let states = {
                    'isTaskRunning': isTaskRunning,
                    'promptQueueLength': promptQueue.length,
                    'rateLimitError': rateLimitError,
                    'rateLimitTime': rateLimitTime,
                    'error': error
                };

                io.emit('serverStatus', states);

                setTimeout(runTask, 1000 * 30 * 60);
                return;
            }

            console.log(e);

        }
        // socket.emit('history', history); // send to clients history changed

        // send to clients history changed
    }

    // if it is sampleQueue, do_one_item
    if (prompt.type == 'sampleQueue') {

        try {
            let { res, hist, e } = await do_one_item(prompt.item, history);

            // if not string and not null, then it is error

            if (e) {

                console.log("error", e);
                error = e;
                rateLimitError = true;

                rateLimitTime = new Date().getTime();

                // send status to clients
                let states = {
                    'isTaskRunning': isTaskRunning,
                    'promptQueueLength': promptQueue.length,
                    'rateLimitError': rateLimitError,
                    'rateLimitTime': rateLimitTime,
                    'error': error
                };
                // send to clients history changed
                io.emit('serverStatus', states);

                console.log(error);

                if (error && typeof error != 'string' && error.statusCode == 504) {
                    setTimeout(runTask, 1000 * 30);
                    return;
                }

                if ('Bad Request' == error.statusText) {
                    setTimeout(runTask, 1000 * 30 * 60);
                    // add prompt back to queue
                    promptQueue.push(prompt);
                    return;

                }
                setTimeout(runTask, 1000 * 30 * 60);
                return;
            }


            console.log("res", res);

            history = hist;

            // if res != null, send history to clients
            if (res != null) {
                io.emit('history', history); // send to clients history changed
            }
        }
        catch (e) {

            let states = {
                'isTaskRunning': isTaskRunning,
                'promptQueueLength': promptQueue.length,
                'rateLimitError': rateLimitError,
                'rateLimitTime': new Date().getTime(),
                'error': e
            };
            // send to clients history changed
            io.emit('serverStatus', states);

            console.log("error", e);

            if (e.statusCode == 504) {

                setTimeout(runTask, 1000 * 30);
                // add prompt back to queue
                promptQueue.push(prompt);
                return;
            }

            if (e.statusText && 'Bad Request' == e.statusText) {

                setTimeout(runTask, 1000 * 60 * 30);
                // add prompt back to queue
                promptQueue.push(prompt);
                return;

            }

        }


    }

    setTimeout(runTask, 1000);

}



const port = 3003;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

runTask();