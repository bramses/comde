// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
// @ts-ignore
import * as OpenAI from '../openai/index.js'
import fetch from 'node-fetch'
import * as fs from 'fs'

// dotenv.config()
let OPENAI_API_KEY = "";
let openai: any = null

const lowTemp = 0.05
const midTemp = 0.5
const highTemp = 1.0


async function showInputBox() {
	const result: string | undefined = await vscode.window.showInputBox({
		value: '',
		placeHolder: 'Input your OpenAI API Key',
	});

	try {
		if (result) {
			setAPIKey(result)
			vscode.window.showInformationMessage("Key added to CoMDe session!");
		} else {
			throw new Error('result is undefined')
		}
	} catch (error) {
		console.error("Invalid key") // todo some 401 magic from actual outbound call
		return "Invalid Key"
	}


}

const setAPIKey = (key:string) => {
	OPENAI_API_KEY = key
	openai = new OpenAI(OPENAI_API_KEY);
	// todo some test call to the openai api
}

const fetchCompletion = async (prompt: string, temperature: number) => {

	try {
		if (OPENAI_API_KEY == "") {
			throw new Error("OpenAI API Key must be set. Press CMD+Shift+P and type \"Set OpenAI API Key\"")
		}
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

const appendToMD = (filename: string = "No Filename Found", temperature:number, language: string, descriptionResult: string, codeBlock: string = "") => {
	const relativeFilename: string | undefined = filename.split('/').slice(-1)[0]
	const path = filename.split('/').slice(0, filename.split('/').length - 1).join('/')
	const mdResult = `# ${relativeFilename} -- ${temperature == lowTemp ? "low temperature" : temperature == midTemp ? "mid temperature" : "high temperature"}: ${language}\n${descriptionResult}\n\n\`\`\`\n${codeBlock}\n\`\`\`\n`


	fs.appendFile(path + '/COMDE.md', mdResult, function (err) {
		if (err) {
			vscode.window.showInformationMessage("Error appending to COMDE.md, see log.");
			console.error(err)
		}
		console.log("Successfully appended to COMDE.md");
	});
}

const descriptionPrompt = (language: string, codeBlock: string | undefined) => `What is this ${language} code doing?\n\nCode:\n\`\`\`\n${codeBlock}\n\`\`\`\n\nAnswer: `

const logic = async (editor: vscode.TextEditor | undefined, temperature: number) => {
	// The code you place here will be executed every time your command is executed
	const codeBlock: string | undefined = editor?.document.getText(editor.selection)
	const filename: string[] | undefined = editor?.document.fileName.split('.');
	const fileType: string | undefined = filename?.slice(-1)[0]

	let descriptionResult = ""

	if (fileType == "js") {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Fetching from OpenAI API'
		}, async (progress) => {
			progress.report({ increment: 0 });
			descriptionResult = await fetchCompletion(descriptionPrompt('Javascript', codeBlock), temperature)
			appendToMD(editor?.document.fileName, temperature, "Javascript", descriptionResult, codeBlock)
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
			appendToMD(editor?.document.fileName, temperature, "Python", descriptionResult, codeBlock)
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
			appendToMD(editor?.document.fileName, temperature, "Typescript", descriptionResult, codeBlock)
			vscode.window.showInformationMessage(descriptionResult);
			progress.report({ increment: 100 });
		});
	} else {
		vscode.window.showInformationMessage(`CoMDe currently only supports .ts | .js | .py`);
	}
}



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "comde" is now active!');
	vscode.window.showInformationMessage(`To get started, your OpenAI API Key must be set. Press CMD+Shift+P and type \"Set OpenAI API Key\"`);

	let setKeyDisposable = vscode.commands.registerCommand('comde.setKey', async () => {
		await showInputBox()
	});

	let disposable = vscode.commands.registerCommand('comde.lowTemp', async () => {
		const editor = vscode.window.activeTextEditor;
		await logic(editor, lowTemp)
	});

	let disposable2 = vscode.commands.registerCommand('comde.midTemp', async () => {
		const editor = vscode.window.activeTextEditor;
		await logic(editor, midTemp)
	});
	let disposable3 = vscode.commands.registerCommand('comde.highTemp', async () => {
		const editor = vscode.window.activeTextEditor;
		await logic(editor, highTemp)
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(setKeyDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
