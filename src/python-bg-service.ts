import streamDeck, { DidReceiveSettingsEvent, KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { PythonServiceSettings } from "./actions/python-service";
import { ChildProcess } from "child_process";
import * as fs from "fs";
import { createChildProcess, mapPythonError } from "./utils/python-utils";
import { processManager } from "./utils/process-manager";
import { applyImageWithFallback } from "./utils/image-utils";

export enum ServiceState {
	running,
	stopped
}

type TrackedAction = {
	id: string;
	ev: WillAppearEvent<PythonServiceSettings> | DidReceiveSettingsEvent<PythonServiceSettings>;
	timerId?: NodeJS.Timeout;
};

type NormalizedSettings = PythonServiceSettings & {
	interval: number;
	displayValues: boolean;
	useVenv: boolean;
	pythonInterpreter?: string;
};

class PythonBackgroundService {
	private trackedActions: TrackedAction[] = [];
	private state: ServiceState = ServiceState.stopped;

	registerAction(ev: WillAppearEvent<PythonServiceSettings> | DidReceiveSettingsEvent<PythonServiceSettings>) {
		streamDeck.logger.info("checking if action is already tracked");
		const existingIndex = this.trackedActions.findIndex(action => action.id === ev.action.id);
		if (existingIndex >= 0) {
			const existing = this.trackedActions[existingIndex];
			if (existing.timerId) {
				clearInterval(existing.timerId);
			}
			const updatedAction: TrackedAction = { ...existing, ev };
			if (this.state === ServiceState.running) {
				updatedAction.timerId = this.createTimer(ev);
			}
			this.trackedActions[existingIndex] = updatedAction;
			streamDeck.logger.info("action already tracked - settings updated");
			return;
		}

		this.trackedActions.push({ id: ev.action.id, ev });
	}

	unregisterAction(ev: WillDisappearEvent<PythonServiceSettings>) {
		const index = this.trackedActions.findIndex(action => action.id === ev.action.id);
		if (index >= 0) {
			const tracked = this.trackedActions[index];
			if (tracked.timerId) {
				streamDeck.logger.info(`stopping execution of the action ${ev.action.manifestId}, id: ${ev.action.id}`);
				clearInterval(tracked.timerId);
			}
			// Clean up any processes associated with this action
			// Note: We can't clean up specific process IDs since they include timestamps,
			// but the processes will auto-cleanup when they exit
			this.trackedActions.splice(index, 1);
		}
	}

	async start(ev: KeyDownEvent<PythonServiceSettings>) {
		streamDeck.logger.info("starting Background Service");
		this.trackedActions.forEach(tracked => {
			if (tracked.timerId) {
				clearInterval(tracked.timerId);
			}
			tracked.timerId = this.createTimer(tracked.ev);
		});
		this.state = ServiceState.running;
		await ev.action.setImage("imgs/actions/pyServiceRunning.png");
	}

	async stop(ev: KeyDownEvent<PythonServiceSettings>) {
		streamDeck.logger.info("stopping Background Service");
		this.trackedActions.forEach(tracked => {
			if (tracked.timerId) {
				clearInterval(tracked.timerId);
				tracked.timerId = undefined;
			}
		});
		this.state = ServiceState.stopped;
		streamDeck.logger.info(`stopping execution of the action ${ev.action.manifestId}, id: ${ev.action.id}`);
		await ev.action.setImage("imgs/actions/pyServiceStopped.png");
	}

	getState = (): ServiceState => {
		return this.state;
	};

	executeAction(ev: WillAppearEvent<PythonServiceSettings> | DidReceiveSettingsEvent<PythonServiceSettings> | KeyDownEvent<PythonServiceSettings>) {
		const settings = this.normalizeSettings(ev.payload.settings);
		const scriptPath = settings.path;
		let pythonProcess: ChildProcess | undefined;

		if (!scriptPath) {
			streamDeck.logger.warn("PythonService: No script path configured");
			return;
		}

		if (!fs.existsSync(scriptPath)) {
			streamDeck.logger.error(`PythonService: Script not found at path: ${scriptPath}`);
			ev.action.setImage("imgs/actions/pyServiceIconFail.png");
			ev.action.setTitle("Script\nNot Found");
			ev.action.showAlert();
			return;
		}

		streamDeck.logger.debug(`path to script is: ${scriptPath}`);
		pythonProcess = createChildProcess(settings.useVenv, settings.venvPath, scriptPath, settings.pythonInterpreter);

		// Register process for lifecycle management with a unique ID for each execution
		// Background services get a longer timeout (10 minutes) since they may run longer
		if (pythonProcess) {
			const processId = `${ev.action.id}-${Date.now()}`;
			processManager.register(processId, pythonProcess, {
				timeout: 10 * 60 * 1000, // 10 minutes
				enabled: true
			});
		}

		if (pythonProcess && pythonProcess.stdout) {
			streamDeck.logger.debug("start reading output");
			pythonProcess.stdout.on("data", async (data: { toString: () => string }) => {
				const output = data.toString().trim();
				streamDeck.logger.info(`stdout: ${output}`);
				if (settings.displayValues) {
					await ev.action.setTitle(output);
				}
				if (settings.image1 && output === (settings.value1 ?? "")) {
					await applyImageWithFallback(ev.action, settings.image1, "imgs/actions/pyServiceIcon.png");
				} else if (settings.image2 && output === (settings.value2 ?? "")) {
					await applyImageWithFallback(ev.action, settings.image2, "imgs/actions/pyServiceIcon.png");
				} else {
					await applyImageWithFallback(ev.action, settings.defaultImage, "imgs/actions/pyServiceIcon.png");
				}
			});

			pythonProcess.stderr?.on("data", async (data: { toString: () => string }) => {
				const errorString = data.toString().trim().replace(/(?:\r\n|\r|\n)/g, " ");
				streamDeck.logger.error(`stderr: ${errorString}`);
				await ev.action.setImage("imgs/actions/pyServiceIconFail.png");
				const errorTitle = mapPythonError(errorString);
				if (errorTitle === "python\nother\nissue") {
					streamDeck.logger.error(errorString);
				}
				await ev.action.setTitle(errorTitle);
				await ev.action.showAlert();
			});

			pythonProcess.on("close", (code: number | null) => {
				streamDeck.logger.debug(`child process exited with code ${code}`);
			});
		}
	}

	private createTimer(ev: WillAppearEvent<PythonServiceSettings> | DidReceiveSettingsEvent<PythonServiceSettings> | KeyDownEvent<PythonServiceSettings>) {
		const settings = this.normalizeSettings(ev.payload.settings);
		const intervalSeconds = settings.interval;
		return setInterval(() => {
			streamDeck.logger.info(`timer triggered after ${intervalSeconds}s for action ${ev.action.manifestId}, id: ${ev.action.id}`);
			this.executeAction(ev);
		}, intervalSeconds * 1000);
	}

	private normalizeSettings(settings: PythonServiceSettings): NormalizedSettings {
		const intervalRaw = typeof settings.interval === "string" ? Number(settings.interval) : settings.interval;
		const interval = Number.isFinite(intervalRaw) && intervalRaw !== undefined && intervalRaw > 0 ? intervalRaw : 10;
		return {
			...settings,
			interval,
			displayValues: Boolean(settings.displayValues),
			useVenv: Boolean(settings.useVenv)
		};
	}
}

export const pyBGService = new PythonBackgroundService();
