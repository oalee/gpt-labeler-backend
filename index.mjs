import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';

import { v4 as uuidv4 } from 'uuid';


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

function automaticallyAddJobsToQueue() {
    // search through history, if there is a job that is not done, add it to queue
    // if there is a job that is done, and there is a next job, add it to queue

    // for each tweet in history
    for (const tweetId in history) {
        // if there is a job that is not done, add it to queue
        const jobs = history[tweetId].jobs;
        if (jobs) {
            for (const job of jobs) {
                if (!job.done) {
                    // add to queue
                    promptQueue.push(job);
                }
            }
        }
    }
}

// automatically add jobs to queue
automaticallyAddJobsToQueue();

io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('sendManualInstruction', async (message) => {
        console.log('Manual instruction received', message);
        // Implement your logic to handle the custom message

        try {
            const { tweetId, manualInstruction } = message;

            // find the last prompt of the tweet
            const lastPrompt = history[tweetId].history[history[tweetId].history.length - 1];
            // add to queue


            let extra = `please only generate a revised JSON output.\nIMPORTANT: The explanation should be for the original task and not mention this step directly. DON'T WRITE FOR EXAMPLE THANK YOU FOR CLARIFYING`

            // append extra to manualInstruction if it is not there

            var instruction = manualInstruction
            if (!instruction.includes(extra)) {
                instruction = instruction + '\n' + extra;
            }



            // add to history, as jobs this prompt queue, this could be null
            history[tweetId].jobs = history[tweetId].jobs || [];

            // just change the instruction of the last item has job and it is not done, it is modifying the job, also remove from queue
            if (history[tweetId].jobs.length > 0 && !history[tweetId].jobs[history[tweetId].jobs.length - 1].done) {

                // change the instruction of the last item
                history[tweetId].jobs[history[tweetId].jobs.length - 1].manualInstruction = instruction;
                // remove from queue
                promptQueue.map((item) => {
                    if (item.type == 'manual' && item.tweetId == tweetId) {
                        // change the instruction
                        item.manualInstruction = instruction;
                    }
                    return item
                });
            } else {
                promptQueue.push({
                    'type': 'manual',
                    'tweetId': tweetId,
                    'lastPrompt': lastPrompt,
                    'manualInstruction': instruction
                })

                // save promptQueue to file
                // savePromptQueue(promptQueue);

                // send status to client that it is added to queue
                socket.emit('manualInstructionStatus', {
                    'status': 'added to queue'
                });



                history[tweetId].jobs.push(
                    {
                        'type': 'manual',
                        'tweetId': tweetId,
                        'lastPrompt': lastPrompt,
                        'manualInstruction': instruction,
                        'done': false,
                    }
                );
            }

            // save history to file
            await saveHistory(history);
            // send history to client
            socket.emit('history', history);

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

        // send message to client that we added prompts to queue
        socket.emit('addedSampleQueue', true);

    });

    socket.on('sendManualCorrection', async (message) => {
        console.log('Manual correction received', message);

        try {
            const { tweetId, manualCorrection } = message;

            // add to history
            const newItem = {
                'parsedOutput': manualCorrection,
                'type': 'manualCorrection',
                'id': uuidv4(),
            }
            history[tweetId].history.push(newItem);

            // save history to file
            await saveHistory(history);

            // send history to client
            socket.emit('history', history);

        }
        catch (e) {
            console.log(e);
        }

    });


    // Stop task event
    socket.on('stopTask', () => {
        // Implement your logic to stop the task
        // You can use a flag or variable to control the task execution
        isTaskRunning = false;
        currentState = 'idle'
        rateLimitError = false;
        rateLimitTime = 0;
        error = null;
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

    socket.on('validate', async (message) => {

        const { tweetId, historyItem } = message;

        // recevied Validation, set history[tweetId]'s historyItem where id is the same to the new historyItem
        history[tweetId].history = history[tweetId].history.map(item => {
            if (item.id == historyItem.id) {
                return historyItem;
            }
            return item;
        }
        );
        // save history to file
        await saveHistory(history);

    });


    // Send server status event
    setInterval(() => {

        let states = {
            'isTaskRunning': isTaskRunning,
            'promptQueueLength': promptQueue.length,
            'rateLimitError': rateLimitError,
            'rateLimitTime': rateLimitTime,
            'error': error,
            'currentState': currentState
        };

        io.emit('serverStatus', states);

        // Emit server status to the client
        socket.emit('serverStatus', {
            ...states // Replace with the actual flag/variable that indicates the task status
        });
    }, 1000);
});

var rateLimitError = false;
var rateLimitTime = 0;
var error = null
var currentState = 'idle'


const twentyFourHourErr = `You've reached our limit of messages per 24 hours`

var isTaskInProcess = false;

async function runTask() {

    // first send status to clients
    // let states = {
    //     'isTaskRunning': isTaskRunning,
    //     'promptQueueLength': promptQueue.length,
    //     'rateLimitError': rateLimitError,
    //     'rateLimitTime': rateLimitTime,
    //     'error': error
    // };

    // io.emit('serverStatus', states);

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

    // status sending prompt, remove error
    rateLimitError = false;
    rateLimitTime = 0;
    error = null;
    currentState = 'Sending prompt'
    io.emit('serverStatus', {
        'isTaskRunning': isTaskRunning,
        'promptQueueLength': promptQueue.length,
        'rateLimitError': rateLimitError,
        'rateLimitTime': rateLimitTime,
        'error': error,
        'currentState': currentState
    });
    currentState = 'Awaiting for response'





    // if prompt is manual, sendQuery
    if (prompt.type == 'manual') {

        try {

            let res = await sendQuery(prompt.manualInstruction, prompt.lastPrompt);
            console.log("res", res);

            res.parsedOutput = JSON.parse(res.text);
            // add to history

            // add instruction to history, type user, data manualInstruction

            history[prompt.tweetId].history.push({
                'type': 'user',
                'data': prompt.manualInstruction
            });

            history[prompt.tweetId].history.push(res);

            // search for jobs in history, and mark as done
            history[prompt.tweetId].jobs = history[prompt.tweetId].jobs.map(job => {
                if (job.type == 'manual' && job.manualInstruction == prompt.manualInstruction) {
                    job.done = true;
                }
                return job;
            });

            // save history to file
            await saveHistory(history);
            console.log("history saved");

            io.emit('history', history); // send to clients history changed
        }
        catch (e) {
            error = e;
            console.log(e);

            if (e.toString().includes(twentyFourHourErr)) {
                // limit reached, stop task
                isTaskRunning = false;
                currentState = '24 hour limit reached, stoped task'
                rateLimitError = true;
                rateLimitTime = new Date().getTime();

                // add to queue
                promptQueue.push(prompt);

                setTimeout(runTask, 1000 * 60 * 60 * 24);
                return;

            }

            // if e.statusCode == 400, then it is rate limit error
            if (e.statusCode == 400) {
                rateLimitError = true;
                // get time
                rateLimitTime = new Date().getTime();
                promptQueue.push(prompt);

                currentState = 'Rate limit error, waiting for 30 minutes'
                // send status to clients

                // check if "one minute" is in string version of error
                if (e.toString().includes('one minute')) {
                    currentState = 'Rate limit error, waiting for 1 minutes'

                    setTimeout(runTask, 1000 * 60);
                    return;
                }

                setTimeout(runTask, 1000 * 30 * 60);
                return;
            }


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
                if (e.toString().includes(twentyFourHourErr)) {
                    // limit reached, stop task
                    isTaskRunning = false;
                    currentState = '24 hour limit reached, stoped task'
                    rateLimitError = true;
                    rateLimitTime = new Date().getTime();

                    // add to queue
                    promptQueue.push(prompt);

                    setTimeout(runTask, 1000 * 60 * 60 * 24);
                    return;

                }
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

                if (error && typeof error != 'string' && error.statusCode == 502) {
                    promptQueue.push(prompt);
                    currentState = 'Error, waiting for 5 minutes'

                    setTimeout(runTask, 1000 * 5);
                    return;
                }

                // if string, and 'Media and text less' in error, then add prompt back to queue
                if (error && typeof error == 'string' && error.includes('Media and text less')) {
                    setTimeout(runTask, 100);
                    // dont add prompt back to queue
                    return;
                }
                if (error && typeof error == 'string' && error.includes('Already done')) {
                    setTimeout(runTask, 100);
                    // dont add prompt back to queue
                    return;
                }

                if ('Bad Request' == error.statusText) {
                    if (e.toString().includes('one minute')) {
                        currentState = 'Rate limit error, waiting for 1 minutes'
                        promptQueue.push(prompt);

                        setTimeout(runTask, 1000 * 60);
                        return;
                    }
                    setTimeout(runTask, 1000 * 30 * 60);
                    // add prompt back to queue
                    currentState = 'Error, waiting for 30 minutes'

                    promptQueue.push(prompt);
                    return;

                }
                promptQueue.push(prompt);
                currentState = 'Error, waiting for 60 seconds'

                setTimeout(runTask, 1000 * 60);
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

            // let states = {
            //     'isTaskRunning': isTaskRunning,
            //     'promptQueueLength': promptQueue.length,
            //     'rateLimitError': rateLimitError,
            //     'rateLimitTime': new Date().getTime(),
            //     'error': e
            // };
            // // send to clients history changed
            // io.emit('serverStatus', states);

            console.log("error", e);
            if (e.toString().includes(twentyFourHourErr)) {
                // limit reached, stop task
                isTaskRunning = false;
                currentState = '24 hour limit reached, stoped task'
                rateLimitError = true;
                rateLimitTime = new Date().getTime();

                // add to queue
                promptQueue.push(prompt);

                setTimeout(runTask, 1000 * 60 * 60 * 24);
                return;

            }
            if (e.statusCode == 502 || e.statusCode == 504) {

                setTimeout(runTask, 1000 * 30);
                currentState = 'Error, waiting for 30 seconds'

                // add prompt back to queue
                promptQueue.push(prompt);
                return;
            }

            if (e.statusText && 'Bad Request' == e.statusText) {
                if (e.toString().includes('one minute')) {
                    currentState = 'Rate limit error, waiting for 1 minutes'
                    promptQueue.push(prompt);

                    setTimeout(runTask, 1000 * 60);
                    return;
                }
                setTimeout(runTask, 1000 * 60 * 30);
                currentState = 'Error, waiting for 30 minutes'

                // add prompt back to queue
                promptQueue.push(prompt);
                return;

            }

        }


    }

    currentState = 'Done! going to next prompt'


    setTimeout(runTask, 2000);

}



const port = 3003;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

runTask();