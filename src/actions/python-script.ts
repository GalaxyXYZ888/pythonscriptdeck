import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { ChildProcess } from "child_process";
import * as fs from "fs";
import { createChildProcess, getFileNameFromPath, mapPythonError } from "../utils/python-utils";
import { processManager } from "../utils/process-manager";
import { applyImageWithFallback } from "../utils/image-utils";

@action({ UUID: "com.nicoohagedorn.pythonscriptdeck.script" })
export class PythonScript extends SingletonAction<PythonScriptSettings> {
	private imageWatchers: Map<string, fs.FSWatcher> = new Map();

	private setupImageWatcher(action: any, defaultImage: string | undefined, fallbackPath: string): void {
		const existingWatcher = this.imageWatchers.get(action.id);
		if (existingWatcher) {
			existingWatcher.close();
			this.imageWatchers.delete(action.id);
		}

		applyImageWithFallback(action, defaultImage, fallbackPath);

		if (defaultImage && fs.existsSync(defaultImage)) {
			try {
				const watcher = fs.watch(defaultImage, async (eventType) => {
					if (eventType === "change") {
						streamDeck.logger.info(`Custom default image changed on disk: ${defaultImage}`);
						await applyImageWithFallback(action, defaultImage, fallbackPath);
					}
				});
				this.imageWatchers.set(action.id, watcher);
			} catch (error) {
				streamDeck.logger.error(`Failed to watch custom image ${defaultImage}: ${error}`);
			}
		}
	}

	/**
	 * The {@link SingletonAction.onWillAppear} event is useful for setting the visual representation of an action when it becomes visible. This could be due to the Stream Deck first
	 * starting up, or the user navigating between pages / folders etc.. There is also an inverse of this event in the form of {@link streamDeck.client.onWillDisappear}. In this example,
	 * we're setting the title to the "count" that is incremented in {@link PythonScript.onKeyDown}.
	 */
	async onWillAppear(ev: WillAppearEvent<PythonScriptSettings>): Promise<void> {
		const settings = ev.payload.settings;
		if (settings.path && settings.path.includes(".py")) {
			const fallback = (settings.useVenv && settings.venvPath)
				? "imgs/actions/gemini_icons/pyVirtEnvActive.png"
				: "imgs/actions/gemini_icons/pyFileLoaded.png";
			this.setupImageWatcher(ev.action, settings.defaultImage, fallback);

			let venvname = "";
			if (settings.useVenv && settings.venvPath) {
				const venvFolderName = getFileNameFromPath(settings.venvPath);
				venvname = `venv:\n ${venvFolderName}\n`;
			}
			await ev.action.setTitle(`${venvname}${getFileNameFromPath(settings.path)}`);
		}
	}

	async onDidReceiveSettings(ev: DidReceiveSettingsEvent<PythonScriptSettings>): Promise<void> {
		const settings = ev.payload.settings;
		if (settings.path && settings.path.includes(".py")) {
			let venvname = "";
			const fallback = (settings.useVenv && settings.venvPath)
				? "imgs/actions/gemini_icons/pyVirtEnvActive.png"
				: "imgs/actions/gemini_icons/pyFileLoaded.png";

			if (settings.useVenv && settings.venvPath) {
				const venvFolderName = getFileNameFromPath(settings.venvPath);
				venvname = `venv:\n ${venvFolderName}\n`;
			}
			this.setupImageWatcher(ev.action, settings.defaultImage, fallback);
			await ev.action.setTitle(`${venvname}${getFileNameFromPath(settings.path)}`);
		} else {
			const existingWatcher = this.imageWatchers.get(ev.action.id);
			if (existingWatcher) {
				existingWatcher.close();
				this.imageWatchers.delete(ev.action.id);
			}
		}
	}

	/**
	 * Listens for the {@link SingletonAction.onKeyDown} event which is emitted by Stream Deck when an action is pressed. Stream Deck provides various events for tracking interaction
	 * with devices including key down/up, dial rotations, and device connectivity, etc. When triggered, {@link ev} object contains information about the event including any payloads
	 * and action information where applicable. In this example, our action will display a counter that increments by one each press. We track the current count on the action's persisted
	 * settings using `setSettings` and `getSettings`.
	 */
	async onKeyDown(ev: KeyDownEvent<PythonScriptSettings>): Promise<void> {
		// Update the count from the settings.
		const settings = ev.payload.settings;
		const scriptPath = settings.path;
		const useVenv = Boolean(settings.useVenv);

		if (!scriptPath) {
			streamDeck.logger.warn("PythonScript: No script path configured");
			await ev.action.showAlert();
			return;
		}

		if (!fs.existsSync(scriptPath)) {
			streamDeck.logger.error(`PythonScript: Script not found at path: ${scriptPath}`);
			await ev.action.setImage("imgs/actions/pyFilecheckFailed.png");
			await ev.action.setTitle("Script\nNot Found");
			await ev.action.showAlert();
			return;
		}

		let pythonProcess: ChildProcess | undefined;
		if (scriptPath) {
			streamDeck.logger.info(`path to script is: ${scriptPath}`);
			pythonProcess = createChildProcess(useVenv, settings.venvPath, scriptPath, settings.pythonInterpreter);

			// Register process for lifecycle management with 2-minute timeout for one-off scripts
			if (pythonProcess) {
				processManager.register(ev.action.id, pythonProcess, {
					timeout: 2 * 60 * 1000, // 2 minutes
					enabled: true
				});
			}

			if (pythonProcess && pythonProcess.stdout) {
				streamDeck.logger.info(`start reading output`);
				pythonProcess.stdout.on("data", async (data: { toString: () => string }) => {
					const output = data.toString().trim();
					streamDeck.logger.info(`stdout: ${output}`);
					if (settings.displayValues) {
						await ev.action.setTitle(output);
					}

					if (settings.image1 && output === (settings.value1 ?? "")) {
						await applyImageWithFallback(ev.action, settings.image1, "imgs/actions/gemini_icons/pyFileLoaded.png");
					} else if (settings.image2 && output === (settings.value2 ?? "")) {
						await applyImageWithFallback(ev.action, settings.image2, "imgs/actions/gemini_icons/pyFileLoaded.png");
					} else {
						const fallback = (settings.useVenv && settings.venvPath)
							? "imgs/actions/gemini_icons/pyVirtEnvActive.png"
							: "imgs/actions/gemini_icons/pyFileLoaded.png";
						await applyImageWithFallback(ev.action, settings.defaultImage, fallback);
					}
				});

				pythonProcess.stderr?.on("data", async (data: { toString: () => string }) => {
					const errorString = data.toString().trim().replace(/(?:\r\n|\r|\n)/g, " ");
					streamDeck.logger.error(`Python error: ${errorString}`);
					await ev.action.setImage("imgs/actions/pyFilecheckFailed.png");
					const errorTitle = mapPythonError(errorString);
					await ev.action.setTitle(errorTitle);
					await ev.action.showAlert();
				});

				pythonProcess.on("close", (code: number | null) => {
					streamDeck.logger.info(`child process exited with code ${code}`);
				});
			}
		}


	}

	/**
	 * Clean up any running processes when the action disappears.
	 */
	onWillDisappear(ev: WillDisappearEvent<PythonScriptSettings>): void {
		streamDeck.logger.info(`PythonScript: Cleaning up process for action ${ev.action.id}`);
		processManager.cleanup(ev.action.id);
		const watcher = this.imageWatchers.get(ev.action.id);
		if (watcher) {
			watcher.close();
			this.imageWatchers.delete(ev.action.id);
		}
	}
}

/**
 * Settings for {@link PythonScript}.
 */
export type PythonScriptSettings = {
	path?: string;
	defaultImage?: string;
	value1?: string;
	image1?: string;
	value2?: string;
	image2?: string;
	displayValues?: boolean;
	useVenv?: boolean;
	venvPath?: string;
	pythonInterpreter?: string;
};
