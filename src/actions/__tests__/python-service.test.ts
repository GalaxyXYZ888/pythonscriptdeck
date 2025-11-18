import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PythonService, PythonServiceSettings } from '../python-service';
import { ServiceState } from '../../python-bg-service';

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

// Mock python-bg-service
jest.mock('../../python-bg-service', () => ({
	pyBGService: {
		registerAction: jest.fn(),
		start: jest.fn(),
		stop: jest.fn(),
		getState: jest.fn(),
	},
	ServiceState: {
		running: 'running',
		stopped: 'stopped',
	},
}));

// Mock python-utils
jest.mock('../../utils/python-utils', () => ({
	getFileNameFromPath: jest.fn((path: string) => path.split('/').pop() || path),
}));

// Import the mocked module to access the mock functions
import { pyBGService } from '../../python-bg-service';

describe('PythonService', () => {
	let pythonService: PythonService;

	beforeEach(() => {
		jest.clearAllMocks();
		pythonService = new PythonService();
	});

	describe('constructor', () => {
		it('should create an instance', () => {
			expect(pythonService).toBeInstanceOf(PythonService);
		});
	});

	describe('checkSettingsComplete', () => {
		it('should return true when all required settings are present', () => {
			const settings: PythonServiceSettings = {
				path: '/path/to/script.py',
				interval: 5,
			};

			expect(pythonService.checkSettingsComplete(settings)).toBe(true);
		});

		it('should return false when path is missing', () => {
			const settings: PythonServiceSettings = {
				interval: 5,
			};

			expect(pythonService.checkSettingsComplete(settings)).toBe(false);
		});

		it('should return false when interval is missing', () => {
			const settings: PythonServiceSettings = {
				path: '/path/to/script.py',
			};

			expect(pythonService.checkSettingsComplete(settings)).toBe(false);
		});

		it('should return false when both path and interval are missing', () => {
			const settings: PythonServiceSettings = {};

			expect(pythonService.checkSettingsComplete(settings)).toBe(false);
		});
	});

	describe('onWillAppear', () => {
		it('should register action when settings are complete', async () => {
			const mockAction = {
				setImage: jest.fn<any>().mockResolvedValue(undefined),
				setTitle: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						interval: 5,
					},
				},
			} as any;

			await pythonService.onWillAppear(mockEvent);

			expect(pyBGService.registerAction).toHaveBeenCalledWith(mockEvent);
		});

		it('should not register action when settings are incomplete', async () => {
			const mockAction = {
				setImage: jest.fn<any>().mockResolvedValue(undefined),
				setTitle: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						// interval missing
					},
				},
			} as any;

			await pythonService.onWillAppear(mockEvent);

			expect(pyBGService.registerAction).not.toHaveBeenCalled();
		});
	});

	describe('onKeyDown', () => {
		it('should stop service when it is running', async () => {
			(pyBGService.getState as jest.Mock).mockReturnValue(ServiceState.running);

			const mockAction = {
				showAlert: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						interval: 5,
					},
				},
			} as any;

			await pythonService.onKeyDown(mockEvent);

			expect(pyBGService.stop).toHaveBeenCalledWith(mockEvent);
			expect(pyBGService.start).not.toHaveBeenCalled();
		});

		it('should start service when it is stopped and settings are complete', async () => {
			(pyBGService.getState as jest.Mock).mockReturnValue(ServiceState.stopped);

			const mockAction = {
				showAlert: jest.fn<any>().mockResolvedValue(undefined),
			};

			const mockEvent = {
				action: mockAction,
				payload: {
					settings: {
						path: '/path/to/script.py',
						interval: 5,
					},
				},
			} as any;

			await pythonService.onKeyDown(mockEvent);

			expect(pyBGService.start).toHaveBeenCalledWith(mockEvent);
			expect(pyBGService.stop).not.toHaveBeenCalled();
		});
	});
});

