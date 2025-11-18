import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PythonAIGenerator } from '../python-ai-generator';

// Mock the Stream Deck SDK
jest.mock('@elgato/streamdeck', () => ({
	__esModule: true,
	default: {
		logger: {
			info: jest.fn<any>(),
			error: jest.fn<any>(),
			warn: jest.fn<any>()
		}
	},
	action: () => (target: any) => target,
	SingletonAction: class SingletonAction<T> {}
}));

// Mock process manager
jest.mock('../../utils/process-manager', () => ({
	processManager: {
		register: jest.fn<any>(),
		cleanup: jest.fn<any>(),
		cleanupAll: jest.fn<any>()
	}
}));

// Mock python-utils
jest.mock('../../utils/python-utils', () => ({
	createChildProcess: jest.fn<any>(),
	mapPythonError: jest.fn<any>((error: string) => 'Python\nError'),
	getFileNameFromPath: jest.fn<any>((path: string) => 'script.py')
}));

// Mock fs
jest.mock('fs', () => ({
	writeFileSync: jest.fn<any>(),
	unlinkSync: jest.fn<any>()
}));

// Mock fetch globally
global.fetch = jest.fn<any>();

describe('PythonAIGenerator', () => {
	let action: PythonAIGenerator;

	beforeEach(() => {
		jest.clearAllMocks();
		action = new PythonAIGenerator();
	});

	describe('constructor', () => {
		it('should create an instance', () => {
			expect(action).toBeInstanceOf(PythonAIGenerator);
		});
	});

	describe('onWillAppear', () => {
		it('should set initial image when no code is generated', async () => {
			const mockEvent = {
				payload: {
					settings: {}
				},
				action: {
					setImage: jest.fn<any>().mockResolvedValue(undefined),
					setTitle: jest.fn<any>().mockResolvedValue(undefined)
				}
			};

			await action.onWillAppear(mockEvent as any);

			expect(mockEvent.action.setImage).toHaveBeenCalledWith('imgs/actions/gemini_icons/pyNoFileFound.png');
			expect(mockEvent.action.setTitle).toHaveBeenCalledWith('AI Code\nGenerator');
		});

		it('should set ready image when code is generated', async () => {
			const mockEvent = {
				payload: {
					settings: {
						generatedCode: 'print("Hello, World!")'
					}
				},
				action: {
					setImage: jest.fn<any>().mockResolvedValue(undefined),
					setTitle: jest.fn<any>().mockResolvedValue(undefined)
				}
			};

			await action.onWillAppear(mockEvent as any);

			expect(mockEvent.action.setImage).toHaveBeenCalledWith('imgs/actions/gemini_icons/pyFileLoaded.png');
			expect(mockEvent.action.setTitle).toHaveBeenCalledWith('AI Code\nReady');
		});
	});

	describe('onDidReceiveSettings', () => {
		it('should update image based on code generation status', async () => {
			const mockEvent = {
				payload: {
					settings: {
						generatedCode: 'print("Test")'
					}
				},
				action: {
					setImage: jest.fn<any>().mockResolvedValue(undefined),
					setTitle: jest.fn<any>().mockResolvedValue(undefined)
				}
			};

			await action.onDidReceiveSettings(mockEvent as any);

			expect(mockEvent.action.setImage).toHaveBeenCalledWith('imgs/actions/gemini_icons/pyFileLoaded.png');
			expect(mockEvent.action.setTitle).toHaveBeenCalledWith('AI Code\nReady');
		});
	});

	describe('onKeyDown', () => {
		it('should show alert when no code is generated', async () => {
			const mockEvent = {
				payload: {
					settings: {}
				},
				action: {
					setTitle: jest.fn<any>().mockResolvedValue(undefined),
					showAlert: jest.fn<any>().mockResolvedValue(undefined)
				}
			};

			await action.onKeyDown(mockEvent as any);

			expect(mockEvent.action.setTitle).toHaveBeenCalledWith('No Code\nGenerated');
			expect(mockEvent.action.showAlert).toHaveBeenCalled();
		});
	});

	describe('API integration', () => {
		it('should be tested with proper mocking', () => {
			// Placeholder for API integration tests
			// In a real scenario, we would mock fetch and test the OpenAI API calls
			expect(true).toBe(true);
		});
	});
});

