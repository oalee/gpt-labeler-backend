
import { ChatGPTAPI } from 'chatgpt'

import { ChatGPTUnofficialProxyAPI } from 'chatgpt'

import { writeFile } from 'fs/promises'

import readline from 'readline';

import fs from 'fs';
// const api = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY })

const api = new ChatGPTUnofficialProxyAPI({
    accessToken: process.env.OPENAI_ACCESS_TOKEN_2,
    apiReverseProxyUrl: 'https://api.pawan.krd/backend-api/conversation'
})

async function processLineByLine() {
    const fileStream = fs.createReadStream('/home/al/GitHub/twitter/data/propaganda/lsample.json');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let data = [];

    for await (const line of rl) {
        // Each line in the input.txt will be successively available here as `line`.
        data.push(JSON.parse(line));
    }

    return data;
}


import labels from '/home/al/GitHub/twitter/data/propaganda/pers_labels.json'  assert { type: 'json' };

// load json from data/propaganda/mult256.json
import data_1 from '/home/al/GitHub/twitter/data/propaganda/sample.json'  assert { type: 'json' };
// import data_2 from '/home/al/data/sample_2.json' assert { type: 'json' };

let data_2 = await processLineByLine()

// merge data and data_2
let merged = data_1.concat(data_2)

// drop duplicate on id and rawContent, this is a dictionary
let unique = merged.filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.rawContent === v.rawContent)) === i)

const data = unique




let filePath = '/home/al/GitHub/twitter/data/propaganda/pers_labels.json'

let historyPath = '/home/al/GitHub/twitter/data/propaganda/pers_labels_history.json'


let revaluatePrompt = `
Please first do a comprehensive analysis of the task, the labels, explanations and conduct a thorough review of your previous output. Consider the following key review questions in your assessment:

- Is there other propaganda techniques that are not identified in the previous output? 
- Are there biases in the previous output? 
- Are the all techniques and targets identified correctly and comprehensively explained.
- Is the negative sentiment towards the Islamic Republic?
- Is there a negative or positive connotations for a (political) ideology, such as right-wing, left-wing, nationalism or religious? Is this included in the explanation and positive or negative target? 
- Does the content reflect everyday life?
- Who are the subjects of negative and positive sentiment?
- Are these sentiments directed towards individuals or groups?
- Is the objective clearly defined and explained?
- Is the explanation in the json i.e., reasoning behind the identified positive and negative targets and the techniques are clear, comprehensive and presented in the explanation? If not, please elaborate and include them in the explanation.
- Is the the identified positive target clearly explained in the explanation? Please do not include any positive target that is loosely inferred or not clearly explained in the explanation.
- Does the text contains positive connotation toward Women.Life.Freedom movement? if so, is it included in the positive target and explained in the explanation. For example, calls for justice, and indications of peoples's freedom of choice, such as the right to choose their own clothing, dancing and pro LGBTQ statements are positive connotations among others.
- Does the tweet undermines the women.life.freedom movement? If so, is this explained in the explanation?

After your evaluation, please generate a revised JSON output if there are any errors or inaccuracies in your previous response. 
IMPORTANT: The explanation should be for the original task and not mention the above review questions.
IMPORTANT: DO NOT MENTION THE ABOVE REVIEW QUESTIONS IN YOUR EXPLANATION. ONLY OUTPUT A JSON WITHOUT ANY ADDITIONAL TEXT.
`

var instruction = `
Role and Instruction: Analysis of Propaganda Techniques from Tweets Around the Women.Life.Freedom Movement

Context:
The women.life.freedom movement was triggered by a distressing incident involving Mahsa Amini, a 22-year-old Iranian Kurdish woman who fell prey to Iran's "morality" police. This event instigated wide-ranging protests across Iran, which were met with a violent reprisal from the regime resulting in the horrifying death of over 500 people, including many school children, across various cities. Since the death of Mahsa Amini, a movement with the main slogan of Women's Life Freedom began in Iran, to free women and their life from oppressive Islamic rules.
There has been a record of serial chemical attacks on school girls for over three months. Meanwhile, the Islamic Republic has not found the culprit; many experts say the culprit is the Islamic Republic, and the lack of investigations and culprits indicates that Islamic republic's terrorist forces orchestrate this. Students are not safe in schools and have been subjected to oppression.
This reaction led to the Islamic Republic being categorized as a terrorist entity. Public sentiment holds intense resentment and antagonism towards the Islamic Republic of Iran, largely due to its enforcement of what are seen as oppressive Islamic values. 
Since the death of Mahsa Amini, a "Women.Life.Freedom" movement began in Iran to overthrow the dictatorship in Iran, i.e., the Islamic Republic and the head of state, Khamenei. However, this movement is not nationalistic in nature, as the main goal is beyond borders; for example, the women in Afghanistan were the first ones in the world to show solidarity with women in Iran after the death of Mahsa Amini.
The Women.Life.Freedom movement is a social movement focused on advocating for women's rights, equality, and freedom. It emerged as a response to various forms of oppression and discrimination faced by women in different societies worldwide. The movement aims to challenge patriarchal norms, fight against gender-based violence, and strive for equal opportunities and choices for women in all aspects of life.

Women.Life.Freedom recognizes that women's experiences and struggles are diverse, and shaped by factors such as culture, religion, socio-economic status, and political systems. It seeks to create a platform where women can share their stories, amplify their voices, and mobilize collective action toward achieving gender equality and dismantling systemic barriers.
Offensive language is often tweaked on social media platforms to circumvent content detection systems. For instance, "Qنی," equivalent to "کونی" in Persian, is a derogatory term with negative connotations towards homosexuality. Terms such as "اسی" is derogatorily used for Hamed Esmailioun. Moreover, "مسی" and "عنینژاد," "قمیلکا" is a derogatory language used to mock "مسیح علینژاد" Masih Alinejad. Hamed Esmalition, Masih Alinejad, and Reza Pahlavi are known opposition figures of the Islamic Republic. 

ملا addresses to Mullahs (Islamic Republic).
چپی addresses to Leftists.
مجاهد addresses to (MEK) سازمان مجاهدين خلق ايران. 
مرگ (یا ننگ) بر سه فاسد ملا چپی مجاهد (Death or shame to three corrupt groups, Mullahs, Leftists, and MEK) contains propaganda technique of Slogan, Loaded_Language (by using Death or Shame) and Guilt_by_Association against Leftists by associating them with Mullahs and MEK which are both hated by the public.
کوروش زمان (Cyrus of our time) addresses Reza Pahlavi. This contains propaganda technique of Slogan, Appeal_to_Values, Appeal_to_Time, Appeal_to_Authority by connecting him to Cyrus the Great. 
جاوید شاه (Eternal King) is a slogan that addresses and Prince Reza Pahlavi. This phrase contains propaganda technique of Slogan, Appeal_to_Values, Appeal_to_Authority by connecting him to ancient Persian kings.
Yasamin Pahlavi is the wife of Prince Reza Pahlavi.
Maryam Rajavi is the leader of MEK. MEK is precived negatively by the public.
ج.ا is an abbreviation for جمهوری اسلامی (Islamic Republic).
ار پی is an abbreviation for Reza Pahlavi.
معصومه علی نژاد and قمیلکا and مصی and عنی نژاد and other combinations of such language is a derogatory language used to mock Masih Alinejad.
اسی is a derogatory term for Hamed Esmailioun.

Task Description: Your task is to analyze tweets to uncover propaganda around women.life.freedom movement. Your goal is to discover the techniques used around the movement, pinpoint the positive and negative targets of the tweet (the entities the tweet aims to support or undermine) and define the objectives of the tweet. 

Instructions:


Tweet Analysis: Begin by thoroughly studying the tweet, translating it to English and the prevailing public sentiment, and any potential concealed language or euphemisms. If the tweet exhibits hate or loaded language toward the Islamic Republic or its authorities, ensure that the Islamic Republic is identified as a negative target. The Islamic Republic is the enemy of women.life.freedom and negative sentiment toward the Islamic republic is not against women.life.freedom.

Technique Detection and Explanation: Your next step should be to recognize the techniques deployed in the tweet. Keep in mind the cultural and sociopolitical context of Iran. Upon identifying the techniques, delve into a detailed explanation of how each technique is employed, complete with examples. The explanation should be comprehensive and not limited to a single sentence. For example, there is no propaganda in the text; in that case, the explanation should start with "No propaganda is detected in this tweet." and should be followed by a comprehensive explanation of why there is no propaganda in the tweet.

Identify the Targets: Your third task is identifying the positive_target(s) and negative_target(s). These are the entities or ideologies that the tweet is attempting to promote or undermine, respectively. Make sure to elucidate and include explanations of the reasoning behind the labeled targets in the explanation section. Identify positive or negative connotations towards (political) ideologies, such as nationalism, left-wing, right-wing, religious, etc. For example, if the tweet exhibits hate or criticism towards the Islamic Republic, make sure to include the Islamic Republic as a negative target. 

Uncover the Objectives: Lastly, elucidate the objectives of the tweet. These objectives could be the desired reactions, feelings, or actions the tweeter wants to incite in the audience.

Technique Labeling: During your analysis, assign suitable labels to the identified techniques from the following list:
Appeal_to_Authority: Asserting a claim is true simply because a valid authority or expert on the issue has said it. This could include cases where the referenced authority is not actually an expert.

Appeal_to_Popularity (also known as Bandwagon): aka  Attempting to persuade the audience to join in and take a course of action because "everyone else is doing it."

Appeal_to_Values (also known as Glittering Generalities): Using words or symbols from the target audience's value system to produce a positive image when associated with a person or idea.

Appeal_to_Fear-Prejudice: Seeking to build support for an idea by instilling fear, anxiety, and/or panic in the population towards an alternative, possibly based on preconceived judgments.

Flag_Waving: Exploiting patriotic sentiments or the strong feelings associated with a group to justify or promote an action or idea.

Causal_Oversimplification: Assuming a single cause when there are actually multiple causes for an issue, and oversimplifying complex issues by blaming a single person or group.

False_Dilemma-No_Choice (also known as Black-and-White Fallacy, Dictatorship): Presenting only two options as the only possibilities when in fact more possibilities exist.

Consequential_Oversimplification: Not provided in the original text, but might refer to simplifying the consequences of actions or events by focusing on one possible outcome while ignoring others.

Straw_Man: Misrepresenting an opponent's position, simplifying it or twisting it, then arguing against this distorted version instead of the original one.

Red_Herring: Introducing irrelevant material to divert attention away from the original argument or issue.

Whataboutism: Discrediting an opponent's position by charging them with hypocrisy without directly refuting their argument, often by bringing up a different issue as a diversion.

Slogans: Using a brief and catchy phrase that encapsulates a position or a call to action, often loaded with emotion and offering oversimplified solutions to complex issues.

Appeal_to_Time: Using an argument that something is right or good because it's old (appeal to tradition) or because it's new or modern (appeal to novelty).

Conversation_Killer (also known as Thought-Terminating Cliché): Using phrases that aim to end the discussion by discouraging critical thought and meaningful conversation.

Loaded_Language: Using words and phrases with strong emotional implications to influence the audience.

Repetition: Repeating the same message again and again so that the audience will eventually accept it.

Exaggeration-minimization: Representing something in an excessive or lesser manner than it actually is, such as making things look bigger, better, or worse, or making them seem less important.

Obfuscation-Vagueness-Confusion: Using intentionally unclear or ambiguous words, leading the audience to their own interpretations which may not align with the original meaning.

Name_Calling-Labeling: Attaching negative or positive labels to a person, group, idea, etc. to influence the audience's perception of them.

Doubt: Questioning the credibility of someone or something, usually with the aim of undermining it.

Guilt_by_Association: Associating a person or idea with something the audience perceives negatively to discredit them.

Appeal_to_Hypocrisy (also known as Tu Quoque): Responding to criticism by accusing the critic of similar or identical wrongdoing, instead of addressing the criticism itself.

Questioning_the_Reputation: Attacking the character, motive, or other attribute of the person making the argument or persons associated with the argument, rather than attacking the argument itself.


Input:

JSON

{
"id": "<tweet_id>",
"text": "<tweet_text>"
}

Output:

JSON

{
"id": "<tweet_id>",
"eng":"<english_translation>",
"explanation": "<comprehensive_explanation_of_techniques_with_examples>",
"labels": ["<technique>", "..."],
"positive_target": ["<positive_target>", "..."],
"negative_target": ["<negative_target>", "..."],
"objectives": ["<objective>", "..."]
}

IMPORTANT: Consider the Islamic Republic and IRGC as terrorist organizations since they have murdered minors and their own citizens. IRGC, Islamic Republic, and its authorities all refer to the same thing (Islamic Republic).
IMPORTANT: Only use the labels listed above for your analysis
IMPORTANT: Your explanation must be comprehensive and exemplify the techniques and their usage. The output should strictly be in JSON format, with no preceding text.
IMPORTANT: Make sure to put the Islamic Republic as the negative target in case of clerics, authorities, etc. The Islamic Republic is the negative target of hate or criticism towards the Islamic Republic or any positive emotion toward women.life.freedom as this is a revolution.
IMPORTANT: IRGC and the Islamic Republic are terrorists because of their crimes and actions in Iran
IMPORTANT: Negative connotations towards IRGC as terrorist and Islamic Republic should count as raising awareness for their crimes in Iran.
IMPORTANT: Don't forget to include "women.life.freedom" as a positive target of tweets that want to help this movement move forward.
IMPORTANT: Khamenei, the supreme leader of Iran, has killed many indirectly and is a dictator. Count him as one. Islamic republic's authorities, administration, and IRGC count as an Islamic republic.
IMPORTANT: Consider that the text could be an emotional response, not from a propagandist.
IMPORTANT: Islamic Republic, its authorities, the goverment and Khamenei oppose women.life.freedom
IMPORTANT: Women.Life.Freedom started as a movement and a revolution to overthrow the dictator of Iran and the Islamic Republic to reach "Freedom for Women's Life."
IMPORTANT: Oppressive forces of the Islamic republic are the Islamic republic and oppressive forces against women.life.freedom refer to them.
IMPORTANT: Make sure to explain why you chose both negative and positive targets and include it in the explanation.
IMPORTANT: Using hashtags such as Mahsa Amini does NOT always implies positivity toward women.life.freedom, it could be hijacked by propagandists to promote specific political ideology or motive.

Only reply by "..." if you understand the task and are ready to begin.
`


async function sendQuery(message, parent) {
    return await api.sendMessage(
        message,
        {
            parentMessageId: parent.id,
            model: 'gpt-3.5-turbo',
            conversationId: parent.conversationId,
            timeoutMs: 2 * 60 * 1000,
            temperature: 0.0001,

        }
    )
}




async function send_instruction() {
    return await api.sendMessage(
        instruction,
        {
            model: 'gpt-3.5-turbo',

        }
    )
}

console.log("STARTING")



// if file does not exist, create it
if (!fs.existsSync(historyPath)) {

    // create json empty file
    fs.writeFileSync(historyPath, JSON.stringify({}));
}

// read history file
let history = fs.readFileSync(historyPath, 'utf8');
// parse history file
// console.log("HISTORY: ", history);
history = JSON.parse(history);

console.log("HISTORY: ", Object.keys(history).length);

let no_props = ['The text does not contain any identified propaganda techniques', 'No propaganda techniques were identified']

// loop through each example in the data, check if id is in lables
// if it is not, send message with json str of item
//  if it is continue
var counter = 0;

// count data where text is less than 35 and no labels

// let cnt = data.map(item => item.text.length < 35).reduce((a, b) => a + b, 0)

// log how many already done
console.log("ALREADY DONE: " + labels.length + " / " + data.length)

// sends instruction, saves history to item.id key, history is array of responses
async function do_one_item(item, history) {

    // check if history has item.id key
    if (history[item.id]) {
        console.log("SKIPPING: " + item.id);
        return {
            res: null,
            hist: history,
            e: "Already done"
        };
    }

    // if media is true and text is less than 35, skip
    if (item.media && item.rawContent.length < 55) {
        console.log("SKIPPING: " + item.id);
        return {
            res: null,
            hist: history,
            e: "Media and text less than 35"
        };
    }


    // send instruction
    var instructionUqn = await send_instruction();

    console.log("SENT INSTRUCTION: ", instructionUqn);




    let hist = [{ "role": "user", "data": instruction }, instructionUqn];

    var sendingItem = { id: item.id, text: item.rawContent };
    sendingItem = JSON.stringify(sendingItem);

    var saveCnt = 0

    while (true) {
        //   let jsonString = JSON.stringify(sendingItem);

        console.log("Sending: ", sendingItem);
        // add sendingItem to history with role of user, add "role": "user" to sendingItem 

        // find the last item in hist with role "assistant"

        let lastAssistant = hist.filter(item => item.role == "assistant")
        lastAssistant = lastAssistant[lastAssistant.length - 1]


        let res = await sendQuery(sendingItem, lastAssistant);

        hist.push({
            role: "user",
            data: sendingItem
        });

        hist.push(res);
        console.log(res);

        //   log if res.text is not json

        try {

            // replace '`' with '''
            res.text = res.text.replace(/`/g, "'");
            let output = JSON.parse(res.text);
            res.parsedOutput = output;

            saveCnt += 1;

            // add to history
            history[item.id] = {
                history: hist,
                item: item
            }


            if (saveCnt > 1) {
                // save history to file
                fs.writeFileSync(historyPath, JSON.stringify(history));
                console.log("SAVED HISTORY");
                return { res, hist: history, e: null };

            }

            sendingItem = revaluatePrompt
            continue;
        }
        catch (e) {
            // if status is 400, then it is an error
            if (e.status == 400) {

                console.log("ERROR: ", res);
                return { res, hist: history, e }
            }
            console.error(e);
            sendingItem = "Not a valid json, only output json. IMPORTANT only output json with no other text";
        }
    }
}



async function start_task() {

    for (const item of data) {


        let jsonz = await do_one_item(item);

        if (jsonz === null) {
            continue;
        } else {
            // log the response
            console.log("response", jsonz);
        }
        let rsponse = JSON.parse(jsonz.text);
        rsponse['text'] = item['rawContent'];
        labels.push(rsponse);
        // save labels to file

        counter += 1;

        console.log(counter);

        let jsonData = JSON.stringify(labels, null, 4);

        try {
            await writeFile(filePath, jsonData, 'utf8');
            console.log('JSON file has been saved successfully.');
        } catch (err) {
            console.error('An error occurred while saving the JSON file:', err);
        }

        // also save history
        let historyData = JSON.stringify(history, null, 4);

        try {
            await writeFile(historyPath, historyData, 'utf8');
            console.log('JSON file has been saved successfully.');
        }
        catch (err) {
            console.error('An error occurred while saving the JSON file:', err);
        }


    }


}


async function getUserInput() {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
// try start_task();, when it fails, wait 30 seconds and try again

async function start() {
    try {
        await start_task();
    } catch (error) {
        if (error.statusCode == 400) {

            console.log("Too many requests, waiting 3 hour");
            setTimeout(start, 1 * 60 * 60 * 1000);

        }
        else {
            console.log(error);
            setTimeout(start, 30000);
        }
    }
}


async function saveHistory(hist) {
    let historyData = JSON.stringify(hist, null, 4);

    try {
        fs.writeFileSync(historyPath, historyData, 'utf8');
        console.log('JSON file has been saved successfully.');
    }
    catch (err) {
        console.error('An error occurred while saving the JSON file:', err);
    }

    // save every hour date format to hour

    // let backupPath = '/home/al/backups/backup_' + Date.now() + '.json'
    try {
        let date = new Date();
        let hour = date.getHours();
        let day = date.getDate();
        let month = date.getMonth();
        let backupPath = '/home/al/backups/backup_' + month + '_' + day + '_' + hour + '.json'
        fs.writeFileSync(backupPath, historyData, 'utf8');
        console.log('JSON backup file has been saved successfully.');
    }
    catch (err) {
        console.error('An error occurred while saving the JSON file:', err);
    }
}

// check if history has item.id key
export const notGeneratedLabels = data.filter(item => !history[item.id])

export {
    instruction,
    revaluatePrompt,
    do_one_item,
    sendQuery,
    send_instruction,
    history,
    data,
    saveHistory

}



// export const samples = data;
