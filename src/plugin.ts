import streamDeck from "@elgato/streamdeck";

import { PythonScript } from "./actions/python-script";
import { PythonService } from "./actions/python-service";
import { pyBGService } from "./python-bg-service";
import { processManager } from "./utils/process-manager";

// Configure logging level - use info for production, trace for debugging
const logLevel = process.env.STREAMDECK_LOG_LEVEL === "trace" ? "trace" : "info";
streamDeck.logger.setLevel(logLevel);

// Register all actions
streamDeck.actions.registerAction(new PythonScript());
streamDeck.actions.registerAction(new PythonService());

// Finally, connect to the Stream Deck.
streamDeck.connect();

// Clean up all processes on plugin shutdown
process.on("SIGTERM", () => {
	streamDeck.logger.info("Plugin shutting down - cleaning up all processes");
	processManager.cleanupAll();
	process.exit(0);
});

process.on("SIGINT", () => {
	streamDeck.logger.info("Plugin interrupted - cleaning up all processes");
	processManager.cleanupAll();
	process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	streamDeck.logger.error(`Uncaught exception: ${error.message}`);
	processManager.cleanupAll();
	process.exit(1);
});
