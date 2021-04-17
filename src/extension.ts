// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as dotenv from 'dotenv'
// @ts-ignore
import * as OpenAI from '../openai/index.js'
import fetch from 'node-fetch'

dotenv.config()
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);

const fetchCompletion = async (prompt: string, temperature: number) => {

	try {
		const { url, data, reqOpts } = await openai.complete({
			prompt: prompt,
			maxTokens: 75,
			temperature: temperature,
			topP: 1,
			presencePenalty: 0,
			frequencyPenalty: 0,
			bestOf: 1,
			n: 1,
			stream: false
		});

		const res = await fetch(url, {
			method: 'post',
			body: JSON.stringify(data),
			headers: reqOpts.headers})
		const json = await res.json()
		console.log(json)
		const completion = json["choices"][0]["text"] 
		return completion
	} catch (error) {
		console.error(error)
		vscode.window.showInformationMessage(`Error fetching GPT-3 Completion`);
	}
}

const descriptionPrompt = (language:string, codeBlock:string | undefined) =>  `What is this ${language} code doing?\n\nCode:\n\`\`\`\n${codeBlock}\n\`\`\`\n\nAnswer: `

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "comde" is now active!');
	const editor = vscode.window.activeTextEditor;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('comde.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		const codeBlock: string | undefined = editor?.document.getText(editor.selection)
		const filename: string[] | undefined = editor?.document.fileName.split('.');
		const fileType: string | undefined = filename?.slice(-1)[0]

		let headerResult = ""
		let descriptionResult = ""

		const lowTemp = 0.05
		const midTemp = 0.5
		const highTemp = 1.0

		if (fileType == "js") {
			descriptionResult = await fetchCompletion(descriptionPrompt('Javascript', codeBlock), lowTemp)
			console.log(descriptionResult)
		} else if (fileType == "py") {

		} else if (fileType == "ts") {

		} else {
			vscode.window.showInformationMessage(`CoMDe currently only supports .ts | .js | .py`);
		}

		const mdResult = `#${headerResult}

		${descriptionResult}
		\`\`\`
		${codeBlock}
		\`\`\`
		`
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
