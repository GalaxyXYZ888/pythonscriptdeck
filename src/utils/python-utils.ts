import { ChildProcess, spawn } from "child_process";
import * as os from "os";
import * as path from "node:path";
import streamDeck from "@elgato/streamdeck";

/**
 * Error mapping for Python errors to user-friendly display strings
 */
export const pythonErrorMap: { [key: string]: string } = {
	"SyntaxError": "Syntax\nError",
	"NameError": "Undefined\nVariable",
	"TypeError": "Type\nError",
	"ValueError": "Invalid\nValue",
	"ZeroDivisionError": "Division\nby Zero",
	"IndexError": "Index\nError",
	"KeyError": "Missing\nKey",
	"AttributeError": "Missing\nAttribute",
	"ImportError": "Import\nFailed",
	"IndentationError": "Indent\nError",
	"No such file or directory": "Script\nNot Found",
	"ModuleNotFoundError": "Module\nMissing",
	"RuntimeError": "Runtime\nError",
	"MemoryError": "Out of\nMemory",
	"OverflowError": "Number\nOverflow",
	"SystemError": "System\nError",
	"FileNotFoundError": "File\nNot Found",
	"PermissionError": "Permission\nDenied",
	"ConnectionError": "Network\nError",
	"TimeoutError": "Timed\nOut",
	"python was not found": "Python\nMissing",
	"is not recognized": "Python\nNot in PATH",
	"Microsoft Store": "Python\nAlias Issue",
	"can't open file": "Script\nNot Found",
};

/**
 * Detailed troubleshooting messages for common errors (logged to console)
 */
export const pythonErrorHelp: { [key: string]: string } = {
	"SyntaxError": "Check your Python script for syntax errors (missing colons, parentheses, quotes, etc.)",
	"IndentationError": "Fix indentation in your Python script (use consistent tabs or spaces)",
	"NameError": "Check that all variables are defined before use",
	"ModuleNotFoundError": "Install the missing Python module using: pip install <module_name>",
	"FileNotFoundError": "Verify the script path is correct and the file exists",
	"PermissionError": "Check file permissions or run Stream Deck with appropriate permissions",
	"python was not found": "Install Python from python.org or Microsoft Store",
	"is not recognized": "Add Python to your system PATH environment variable",
	"Microsoft Store": "Disable Python app execution aliases in Windows Settings > Apps > App execution aliases",
	"TimeoutError": "Script took too long to execute. Consider optimizing or increasing timeout.",
	"can't open file": "Verify the script path is correct and the file exists",
};

/**
 * Creates a child process to execute a Python script
 * @param useVenv - Whether to use a virtual environment
 * @param venvPath - Path to the virtual environment (required if useVenv is true)
 * @param scriptPath - Path to the Python script to execute
 * @returns ChildProcess instance or undefined if creation fails
 */
export function createChildProcess(
	useVenv: boolean,
	venvPath: string | undefined,
	scriptPath: string,
	pythonInterpreter?: string
): ChildProcess | undefined {
	let pythonProcess: ChildProcess | undefined;
	const isWindows = os.platform() === "win32";
	const normalizedScriptPath = isWindows ? path.win32.normalize(scriptPath) : scriptPath;
	const env = { ...process.env, PYTHONIOENCODING: "utf-8" };

	if (useVenv && venvPath) {
		if (isWindows) {
			const pythonExecutable = path.win32.join(venvPath, "Scripts", "python.exe");
			pythonProcess = spawn(pythonExecutable, [normalizedScriptPath], { windowsHide: true, env });
		} else {
			const pythonExecutable = path.posix.join(venvPath, "bin", "python3");
			pythonProcess = spawn(pythonExecutable, [normalizedScriptPath], { env });
		}
	} else {
		if (isWindows) {
			const executable = pythonInterpreter && pythonInterpreter.trim().length > 0 ? pythonInterpreter : "python";
			pythonProcess = spawn(executable, [normalizedScriptPath], { windowsHide: true, env });
		} else {
			const executable = pythonInterpreter && pythonInterpreter.trim().length > 0 ? pythonInterpreter : "python3";
			pythonProcess = spawn(executable, [normalizedScriptPath], { env });
		}
	}

	pythonProcess?.on("error", (error: Error) => {
		streamDeck.logger.error(`Failed to start python process: ${error.message}`);
	});

	return pythonProcess;
}

/**
 * Extracts the filename from a file path
 * @param filePath - Full path to the file
 * @returns The filename portion of the path
 */
export function getFileNameFromPath(filePath: string): string {
	return path.basename(filePath);
}

/**
 * Maps a Python error string to a user-friendly error title and logs troubleshooting help
 * @param errorString - The error string from Python stderr
 * @returns A formatted error title for display on Stream Deck
 */
export function mapPythonError(errorString: string): string {
	for (const key in pythonErrorMap) {
		if (errorString.includes(key)) {
			// Log helpful troubleshooting message if available
			if (pythonErrorHelp[key]) {
				streamDeck.logger.info(`💡 Troubleshooting tip: ${pythonErrorHelp[key]}`);
			}
			return pythonErrorMap[key];
		}
	}

	// Log the full error for unknown errors to help with debugging
	streamDeck.logger.error(`Unknown Python error: ${errorString}`);
	return "Python\nError";
}

