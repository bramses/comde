# index.ts -- low temperature: Typescript

This code is importing the VSCode library and the dotenv library. It also imports OpenAI, which is a library for AI.

```
import * as vscode from 'vscode'
import * as dotenv from 'dotenv'
// @ts-ignore
import * as OpenAI from '../openai/index.js'
import fetch from 'node-fetch'
import * as fs from 'fs'
```

# index.ts -- low temperature: Typescript

This code is setting up the environment for an OpenAI agent.

```
dotenv.config()
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);

const lowTemp = 0.05
const midTemp = 0.5
const highTemp = 1.0
```

# index.ts -- low temperature: Typescript


This code is fetching the completion of a GPT-3 task.

```
const fetchCompletion = async (prompt: string, temperature: number) => {

	try {
		const { url, data, reqOpts } = await openai.complete({
			prompt: prompt,
			maxTokens: 75,
			temperature: temperature,
			topP: 1,
			presencePenalty: 0,
			frequencyPenalty: 1,
			bestOf: 1,
			n: 1,
			stream: false
		});

		const res = await fetch(url, {
			method: 'post',
			body: JSON.stringify(data),
			headers: reqOpts.headers
		})
		const json = await res.json()
		const completion = json["choices"][0]["text"]

		return completion
	} catch (error) {
		console.error(error)
		vscode.window.showInformationMessage("Error fetching GPT-3 Completion, see log");
	}
}
```
# index.ts -- low temperature: Typescript


This code is appending the contents of a file to another file.

```
const appendToMD = (filename: string = "No Filename Found", temperature:number, language: string, descriptionResult: string, codeBlock: string = "") => {
	const mdResult = `# ${filename} -- ${temperature == lowTemp ? "low temperature" : temperature == midTemp ? "mid temperature" : "high temperature"}: ${language}\n${descriptionResult}\n\n\`\`\`\n${codeBlock}\n\`\`\`\n`

	fs.appendFile('COMDE.md', mdResult, function (err) {
		if (err) {
			vscode.window.showInformationMessage("Error appending to COMDE.md, see log.");
			console.error(err)
		}
		console.log("Successfully appended to COMDE.md");
	});
}
```
# index.ts -- low temperature: Typescript


This code is a function that will be executed every time the command is executed. It checks to see what type of file it is and then executes the appropriate code.

```
const logic = async (editor: vscode.TextEditor | undefined, temperature: number) => {
	// The code you place here will be executed every time your command is executed
	const codeBlock: string | undefined = editor?.document.getText(editor.selection)
	const filename: string[] | undefined = editor?.document.fileName.split('.');
	const fileType: string | undefined = filename?.slice(-1)[0]
	const relativeFilename: string | undefined = editor?.document.fileName.split('/').slice(-1)[0]

	let descriptionResult = ""

	if (fileType == "js") {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Fetching from OpenAI API'
		}, async (progress) => {
			progress.report({ increment: 0 });
			descriptionResult = await fetchCompletion(descriptionPrompt('Javascript', codeBlock), temperature)
			appendToMD(relativeFilename, temperature, "Javascript", descriptionResult, codeBlock)
			vscode.window.showInformationMessage(descriptionResult);
			progress.report({ increment: 100 });
		});

	} else if (fileType == "py") {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Fetching from OpenAI API'
		}, async (progress) => {
			progress.report({ increment: 0 });
			descriptionResult = await fetchCompletion(descriptionPrompt('Python', codeBlock), temperature)
			appendToMD(relativeFilename, temperature, "Python", descriptionResult, codeBlock)
			vscode.window.showInformationMessage(descriptionResult);
			progress.report({ increment: 100 });
		});
		
	} else if (fileType == "ts") {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Fetching from OpenAI API'
		}, async (progress) => {
			progress.report({ increment: 0 });
			descriptionResult = await fetchCompletion(descriptionPrompt('Typescript', codeBlock), temperature)
			appendToMD(relativeFilename, temperature, "Typescript", descriptionResult, codeBlock)
			vscode.window.showInformationMessage(descriptionResult);
			progress.report({ increment: 100 });
		});
	} else {
		vscode.window.showInformationMessage(`CoMDe currently only supports .ts | .js | .py`);
	}
}
```

# index.ts -- low temperature: Typescript


This code is a Typescript function that will be executed when the extension is activated. It registers three commands with the editor, and then subscribes to them.

```
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "comde" is now active!');
	const editor = vscode.window.activeTextEditor;

	let disposable = vscode.commands.registerCommand('comde.lowTemp', async () => {
		await logic(editor, lowTemp)
	});

	let disposable2 = vscode.commands.registerCommand('comde.medTemp', async () => {
		await logic(editor, midTemp)
	});
	let disposable3 = vscode.commands.registerCommand('comde.highTemp', async () => {
		await logic(editor, highTemp)
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
}
```
