import streamDeck from "@elgato/streamdeck";
import { ChildProcess } from "child_process";

/**
 * Configuration for process timeout
 */
export interface ProcessTimeoutConfig {
	/** Timeout in milliseconds (default: 5 minutes) */
	timeout?: number;
	/** Whether to enable timeout (default: true) */
	enabled?: boolean;
}

/**
 * Manages the lifecycle of spawned Python child processes.
 * Tracks all processes and ensures proper cleanup on various lifecycle events.
 */
class ProcessManager {
	private processes: Map<string, ChildProcess> = new Map();
	private timeouts: Map<string, NodeJS.Timeout> = new Map();
	private defaultTimeout: number = 5 * 60 * 1000; // 5 minutes default

	/**
	 * Register a child process for lifecycle management.
	 * @param id - Unique identifier for the process (e.g., action ID)
	 * @param process - The child process to track
	 * @param config - Optional timeout configuration
	 */
	register(id: string, process: ChildProcess, config?: ProcessTimeoutConfig): void {
		// Clean up any existing process with the same ID
		this.cleanup(id);

		this.processes.set(id, process);
		streamDeck.logger.debug(`ProcessManager: Registered process ${id}. Total processes: ${this.processes.size}`);

		// Set up timeout if enabled
		const timeoutEnabled = config?.enabled !== false; // Default to true
		const timeoutMs = config?.timeout || this.defaultTimeout;

		if (timeoutEnabled) {
			const timeoutId = setTimeout(() => {
				streamDeck.logger.warn(`ProcessManager: Process ${id} timed out after ${timeoutMs}ms`);
				this.cleanup(id);
			}, timeoutMs);

			this.timeouts.set(id, timeoutId);
		}

		// Auto-cleanup when process exits
		process.on("exit", (code) => {
			streamDeck.logger.debug(`ProcessManager: Process ${id} exited with code ${code}`);
			this.clearTimeout(id);
			this.processes.delete(id);
		});
	}

	/**
	 * Clear timeout for a process
	 */
	private clearTimeout(id: string): void {
		const timeoutId = this.timeouts.get(id);
		if (timeoutId) {
			clearTimeout(timeoutId);
			this.timeouts.delete(id);
		}
	}

	/**
	 * Clean up a specific process by ID.
	 * Kills the process if it's still running and removes it from tracking.
	 * @param id - The process ID to clean up
	 */
	cleanup(id: string): void {
		// Clear any pending timeout
		this.clearTimeout(id);

		const process = this.processes.get(id);
		if (process && !process.killed) {
			streamDeck.logger.info(`ProcessManager: Killing process ${id}`);
			try {
				process.kill("SIGTERM");
				// Give it a moment, then force kill if needed
				setTimeout(() => {
					if (process && !process.killed) {
						streamDeck.logger.warn(`ProcessManager: Force killing process ${id}`);
						process.kill("SIGKILL");
					}
				}, 1000);
			} catch (error) {
				streamDeck.logger.error(`ProcessManager: Error killing process ${id}: ${error}`);
			}
		}
		this.processes.delete(id);
	}

	/**
	 * Clean up all tracked processes.
	 * Should be called on plugin shutdown.
	 */
	cleanupAll(): void {
		streamDeck.logger.info(`ProcessManager: Cleaning up all processes (${this.processes.size} total)`);
		const processIds = Array.from(this.processes.keys());
		for (const id of processIds) {
			this.cleanup(id);
		}
	}

	/**
	 * Get the number of currently tracked processes.
	 */
	getProcessCount(): number {
		return this.processes.size;
	}

	/**
	 * Check if a process with the given ID is being tracked.
	 */
	hasProcess(id: string): boolean {
		return this.processes.has(id);
	}

	/**
	 * Get a process by ID (for testing/debugging).
	 */
	getProcess(id: string): ChildProcess | undefined {
		return this.processes.get(id);
	}

	/**
	 * Set the default timeout for all processes.
	 * @param timeoutMs - Timeout in milliseconds
	 */
	setDefaultTimeout(timeoutMs: number): void {
		this.defaultTimeout = timeoutMs;
		streamDeck.logger.info(`ProcessManager: Default timeout set to ${timeoutMs}ms`);
	}

	/**
	 * Get the default timeout value.
	 */
	getDefaultTimeout(): number {
		return this.defaultTimeout;
	}
}

// Export singleton instance
export const processManager = new ProcessManager();

