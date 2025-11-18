import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { ChildProcess } from "child_process";
import { createChildProcess, mapPythonError } from "../utils/python-utils";
import { processManager } from "../utils/process-manager";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

@action({ UUID: "com.nicoohagedorn.pythonscriptdeck.aigenerator" })
export class PythonAIGenerator extends SingletonAction<PythonAIGeneratorSettings> {
	private actionContexts: Map<string, any> = new Map();

	/**
	 * Handle when the action appears on the Stream Deck
	 */
	async onWillAppear(ev: WillAppearEvent<PythonAIGeneratorSettings>): Promise<void> {
		// Store action context for later use
		this.actionContexts.set(ev.action.id, ev.action);
		const settings = ev.payload.settings;
		
		// Set initial image based on whether code has been generated
		if (settings.generatedCode) {
			await ev.action.setImage("imgs/actions/gemini_icons/pyFileLoaded.png");
			await ev.action.setTitle("AI Code\nReady");
		} else {
			await ev.action.setImage("imgs/actions/gemini_icons/pyNoFileFound.png");
			await ev.action.setTitle("AI Code\nGenerator");
		}
	}

	/**
	 * Handle settings updates
	 */
	async onDidReceiveSettings(ev: DidReceiveSettingsEvent<PythonAIGeneratorSettings>): Promise<void> {
		const settings = ev.payload.settings;
		
		if (settings.generatedCode) {
			await ev.action.setImage("imgs/actions/gemini_icons/pyFileLoaded.png");
			await ev.action.setTitle("AI Code\nReady");
		} else {
			await ev.action.setImage("imgs/actions/gemini_icons/pyNoFileFound.png");
			await ev.action.setTitle("AI Code\nGenerator");
		}
	}

	/**
	 * Handle messages from the Property Inspector
	 */
	async onSendToPlugin(ev: SendToPluginEvent<GenerateCodePayload, PythonAIGeneratorSettings>): Promise<void> {
		const { payload } = ev;
		const actionContext = this.actionContexts.get(ev.action.id);

		if (!actionContext) {
			streamDeck.logger.warn("Action context not found");
			return;
		}

		if (payload.event === "generateCode") {
			const prompt = payload.prompt || "";
			const apiKey = payload.apiKey || "";
			const provider = payload.provider || "openai";
			const model = payload.model || "";
			await this.generatePythonCode(actionContext, prompt, apiKey, provider, model);
		} else if (payload.event === "executeCode") {
			await this.executeGeneratedCode(actionContext);
		}
	}

	/**
	 * Generate Python code using AI API
	 */
	private async generatePythonCode(actionContext: any, prompt: string, apiKey: string, provider: string, model: string): Promise<void> {
		try {
			streamDeck.logger.info(`Generating Python code using ${provider} for prompt: ${prompt}`);

			// Send status update to PI
			await actionContext.sendToPropertyInspector({ event: "generationStarted" });
			await actionContext.setTitle("Generating\nCode...");

			// Generate code based on provider
			let generatedCode: string;
			switch (provider) {
				case "openai":
					generatedCode = await this.generateWithOpenAI(prompt, apiKey, model);
					break;
				case "anthropic":
					generatedCode = await this.generateWithAnthropic(prompt, apiKey, model);
					break;
				case "google":
					generatedCode = await this.generateWithGoogle(prompt, apiKey, model);
					break;
				case "groq":
					generatedCode = await this.generateWithGroq(prompt, apiKey, model);
					break;
				default:
					throw new Error(`Unsupported provider: ${provider}`);
			}
			
			// Clean up markdown code blocks if present
			let cleanCode = generatedCode;
			if (cleanCode.startsWith("```python")) {
				cleanCode = cleanCode.replace(/```python\n?/, "").replace(/```$/, "").trim();
			} else if (cleanCode.startsWith("```")) {
				cleanCode = cleanCode.replace(/```\n?/, "").replace(/```$/, "").trim();
			}

			streamDeck.logger.info(`Generated code:\n${cleanCode}`);

			// Update settings with generated code
			const currentSettings = await actionContext.getSettings();
			currentSettings.generatedCode = cleanCode;
			await actionContext.setSettings(currentSettings);

			// Send code back to PI
			await actionContext.sendToPropertyInspector({
				event: "codeGenerated",
				code: cleanCode
			});

			await actionContext.setImage("imgs/actions/gemini_icons/pyFileLoaded.png");
			await actionContext.setTitle("AI Code\nReady");

		} catch (error) {
			streamDeck.logger.error(`Error generating code: ${error}`);
			await actionContext.sendToPropertyInspector({
				event: "generationError",
				error: error instanceof Error ? error.message : String(error)
			});
			await actionContext.setTitle("Generation\nFailed");
			await actionContext.showAlert();
		}
	}

	/**
	 * Execute the generated Python code
	 */
	private async executeGeneratedCode(actionContext: any): Promise<void> {
		const settings = await actionContext.getSettings();

		if (!settings.generatedCode) {
			streamDeck.logger.warn("No code to execute");
			await actionContext.setTitle("No Code\nGenerated");
			await actionContext.showAlert();
			return;
		}

		try {
			// Create a temporary file for the generated code
			const tempDir = os.tmpdir();
			const tempFile = path.join(tempDir, `streamdeck_ai_${Date.now()}.py`);

			fs.writeFileSync(tempFile, settings.generatedCode);
			streamDeck.logger.info(`Executing generated code from: ${tempFile}`);

			await actionContext.setImage("imgs/actions/pyFileRunning.png");
			await actionContext.setTitle("Executing\nAI Code...");

			// Execute the Python script
			const pythonProcess = createChildProcess(false, undefined, tempFile);

			if (!pythonProcess) {
				streamDeck.logger.error("Failed to create Python process");
				await actionContext.setTitle("Execution\nFailed");
				await actionContext.showAlert();
				fs.unlinkSync(tempFile); // Clean up temp file
				return;
			}

			// Register process for lifecycle management with 2-minute timeout
			processManager.register(actionContext.id, pythonProcess, {
				timeout: 2 * 60 * 1000,
				enabled: true
			});

			let output = "";
			let errorOutput = "";

			pythonProcess.stdout?.on("data", (data: { toString: () => string }) => {
				output += data.toString();
				streamDeck.logger.info(`stdout: ${data.toString()}`);
			});

			pythonProcess.stderr?.on("data", async (data: { toString: () => string }) => {
				errorOutput += data.toString();
				const errorString = data.toString().trim().replace(/(?:\r\n|\r|\n)/g, " ");
				streamDeck.logger.error(`Python error: ${errorString}`);
				await actionContext.setImage("imgs/actions/pyFilecheckFailed.png");
				const errorTitle = mapPythonError(errorString);
				await actionContext.setTitle(errorTitle);
				await actionContext.showAlert();
			});

			pythonProcess.on("close", async (code: number) => {
				streamDeck.logger.info(`Python process exited with code ${code}`);

				// Clean up temp file
				try {
					fs.unlinkSync(tempFile);
				} catch (err) {
					streamDeck.logger.warn(`Failed to delete temp file: ${err}`);
				}

				if (code === 0) {
					await actionContext.setImage("imgs/actions/pyFilecheckPassed.png");

					// Send output to PI
					await actionContext.sendToPropertyInspector({
						event: "executionComplete",
						output: output.trim(),
						exitCode: code
					});

					// Display output on button if available
					if (output.trim()) {
						const displayOutput = output.trim().substring(0, 20); // Limit to 20 chars
						await actionContext.setTitle(`Output:\n${displayOutput}`);
					} else {
						await actionContext.setTitle("Execution\nSuccess");
					}
				} else {
					await actionContext.setImage("imgs/actions/pyFilecheckFailed.png");
					await actionContext.setTitle("Execution\nFailed");
					await actionContext.showAlert();

					await actionContext.sendToPropertyInspector({
						event: "executionComplete",
						output: errorOutput.trim(),
						exitCode: code
					});
				}
			});

		} catch (error) {
			streamDeck.logger.error(`Error executing code: ${error}`);
			await actionContext.setTitle("Execution\nError");
			await actionContext.showAlert();
		}
	}

	/**
	 * Handle key press - execute the generated code
	 */
	async onKeyDown(ev: KeyDownEvent<PythonAIGeneratorSettings>): Promise<void> {
		const settings = ev.payload.settings;

		if (!settings.generatedCode) {
			streamDeck.logger.warn("No code to execute");
			await ev.action.setTitle("No Code\nGenerated");
			await ev.action.showAlert();
			return;
		}

		// Execute the code when the button is pressed
		await this.executeGeneratedCode(ev.action);
	}

	/**
	 * Clean up action context when action disappears
	 */
	onWillDisappear(ev: WillDisappearEvent<PythonAIGeneratorSettings>): void {
		this.actionContexts.delete(ev.action.id);
		processManager.cleanup(ev.action.id);
	}

	/**
	 * Generate code using OpenAI API
	 */
	private async generateWithOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
		const selectedModel = model || "gpt-4o-mini";

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: selectedModel,
				messages: [
					{
						role: "system",
						content: "You are a Python code generator. Generate clean, executable Python code based on the user's request. Only return the Python code without any markdown formatting or explanations. The code should be ready to execute."
					},
					{
						role: "user",
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 2000
			})
		});

		if (!response.ok) {
			const errorData: any = await response.json();
			throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
		}

		const data: any = await response.json();
		return data.choices[0].message.content.trim();
	}

	/**
	 * Generate code using Anthropic Claude API
	 */
	private async generateWithAnthropic(prompt: string, apiKey: string, model: string): Promise<string> {
		const selectedModel = model || "claude-3-5-sonnet-20241022";

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01"
			},
			body: JSON.stringify({
				model: selectedModel,
				max_tokens: 2000,
				messages: [
					{
						role: "user",
						content: `You are a Python code generator. Generate clean, executable Python code based on the following request. Only return the Python code without any markdown formatting or explanations. The code should be ready to execute.\n\nRequest: ${prompt}`
					}
				]
			})
		});

		if (!response.ok) {
			const errorData: any = await response.json();
			throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
		}

		const data: any = await response.json();
		return data.content[0].text.trim();
	}

	/**
	 * Generate code using Google Gemini API
	 */
	private async generateWithGoogle(prompt: string, apiKey: string, model: string): Promise<string> {
		const selectedModel = model || "gemini-1.5-flash";

		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: `You are a Python code generator. Generate clean, executable Python code based on the following request. Only return the Python code without any markdown formatting or explanations. The code should be ready to execute.\n\nRequest: ${prompt}`
							}
						]
					}
				],
				generationConfig: {
					temperature: 0.7,
					maxOutputTokens: 2000
				}
			})
		});

		if (!response.ok) {
			const errorData: any = await response.json();
			throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
		}

		const data: any = await response.json();
		return data.candidates[0].content.parts[0].text.trim();
	}

	/**
	 * Generate code using Groq API
	 */
	private async generateWithGroq(prompt: string, apiKey: string, model: string): Promise<string> {
		const selectedModel = model || "llama-3.3-70b-versatile";

		const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: selectedModel,
				messages: [
					{
						role: "system",
						content: "You are a Python code generator. Generate clean, executable Python code based on the user's request. Only return the Python code without any markdown formatting or explanations. The code should be ready to execute."
					},
					{
						role: "user",
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 2000
			})
		});

		if (!response.ok) {
			const errorData: any = await response.json();
			throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
		}

		const data: any = await response.json();
		return data.choices[0].message.content.trim();
	}
}

/**
 * Settings for the AI Generator action
 */
type PythonAIGeneratorSettings = {
	provider?: "openai" | "anthropic" | "google" | "groq";
	apiKey?: string;
	model?: string;
	prompt?: string;
	generatedCode?: string;
};

/**
 * Payload for sendToPlugin events
 */
type GenerateCodePayload = {
	event: "generateCode" | "executeCode";
	prompt?: string;
	apiKey?: string;
	provider?: string;
	model?: string;
};

