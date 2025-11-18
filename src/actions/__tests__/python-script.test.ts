import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PythonScript, PythonScriptSettings } from '../python-script';

// Mock streamDeck
jest.mock('@elgato/streamdeck', () => ({
	__esModule: true,
	default: {
		logger: {
			error: jest.fn(),
			info: jest.fn(),
			debug: jest.fn(),
			warn: jest.fn(),
		},
	},
	action: () => (target: any) => target,
	SingletonAction: class SingletonAction<T> {},
}));

// Mock python-utils
jest.mock('../../utils/python-utils', () => ({
	createChildProcess: jest.fn(),
	getFileNameFromPath: jest.fn((path: string) => path.split('/').pop() || path),
	mapPythonError: jest.fn((error: string) => 'python\nother\nissue'),
}));

describe('PythonScript', () => {
	let pythonScript: PythonScript;

	beforeEach(() => {
		jest.clearAllMocks();
		pythonScript = new PythonScript();
	});

	describe('constructor', () => {
		it('should create an instance', () => {
			expect(pythonScript).toBeInstanceOf(PythonScript);
		});
	});

	describe('onWillAppear', () => {
		it('should set image and title when path contains .py', async () => {
			const mockAction = {
				setImage: jest.fn<any>().mockResolvedValue(undefined),
				setTitle: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						useVenv: false,
					},
				},
			} as any;

			await pythonScript.onWillAppear(mockEvent);

			expect(mockAction.setImage).toHaveBeenCalledWith('imgs/actions/gemini_icons/pyFileLoaded.png');
			expect(mockAction.setTitle).toHaveBeenCalledWith('script.py');
		});

		it('should include venv name in title when using venv', async () => {
			const mockAction = {
				setImage: jest.fn<any>().mockResolvedValue(undefined),
				setTitle: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						useVenv: true,
						venvPath: '/path/to/myenv/bin/python3',
					},
				},
			} as any;

			await pythonScript.onWillAppear(mockEvent);

			expect(mockAction.setImage).toHaveBeenCalled();
			expect(mockAction.setTitle).toHaveBeenCalled();
			// Title should include venv name
			const titleCall = (mockAction.setTitle as jest.Mock).mock.calls[0][0];
			expect(titleCall).toContain('venv:');
		});

		it('should not set image/title when path does not contain .py', async () => {
			const mockAction = {
				setImage: jest.fn(),
				setTitle: jest.fn(),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.txt',
					},
				},
			} as any;

			await pythonScript.onWillAppear(mockEvent);

			expect(mockAction.setImage).not.toHaveBeenCalled();
			expect(mockAction.setTitle).not.toHaveBeenCalled();
		});

		it('should handle missing path gracefully', async () => {
			const mockAction = {
				setImage: jest.fn(),
				setTitle: jest.fn(),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {},
				},
			} as any;

			await pythonScript.onWillAppear(mockEvent);

			expect(mockAction.setImage).not.toHaveBeenCalled();
			expect(mockAction.setTitle).not.toHaveBeenCalled();
		});
	});

	describe('onDidReceiveSettings', () => {
		it('should update image based on venv usage', async () => {
			const mockAction = {
				setImage: jest.fn<any>().mockResolvedValue(undefined),
				setTitle: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						useVenv: true,
						venvPath: '/path/to/venv/bin/python3',
					},
				},
			} as any;

			await pythonScript.onDidReceiveSettings(mockEvent);

			expect(mockAction.setImage).toHaveBeenCalledWith('imgs/actions/gemini_icons/pyVirtEnvActive.png');
		});
	});
});

