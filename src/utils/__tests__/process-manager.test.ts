import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { processManager } from '../process-manager';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Mock streamDeck logger
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
}));

// Helper to create a mock ChildProcess
function createMockProcess(): ChildProcess {
	const mockProcess = new EventEmitter() as any;
	mockProcess.killed = false;
	mockProcess.kill = jest.fn<any>((signal?: string) => {
		mockProcess.killed = true;
		mockProcess.emit('exit', 0);
		return true;
	});
	mockProcess.pid = Math.floor(Math.random() * 10000);
	return mockProcess as ChildProcess;
}

describe('ProcessManager', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Clean up any processes from previous tests
		processManager.cleanupAll();
	});

	afterEach(() => {
		// Ensure cleanup after each test
		processManager.cleanupAll();
	});

	describe('register', () => {
		it('should register a new process', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-1';

			processManager.register(processId, mockProcess);

			expect(processManager.hasProcess(processId)).toBe(true);
			expect(processManager.getProcessCount()).toBe(1);
		});

		it('should replace existing process with same ID', () => {
			const mockProcess1 = createMockProcess();
			const mockProcess2 = createMockProcess();
			const processId = 'test-process-1';

			processManager.register(processId, mockProcess1);
			processManager.register(processId, mockProcess2);

			expect(processManager.getProcessCount()).toBe(1);
			expect(mockProcess1.kill).toHaveBeenCalled();
		});

		it('should auto-cleanup when process exits', (done) => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-auto-cleanup';

			processManager.register(processId, mockProcess);
			expect(processManager.hasProcess(processId)).toBe(true);

			// Simulate process exit
			mockProcess.emit('exit', 0);

			// Give it a moment for the event handler to run
			setTimeout(() => {
				expect(processManager.hasProcess(processId)).toBe(false);
				done();
			}, 10);
		});

		it('should track multiple processes', () => {
			const mockProcess1 = createMockProcess();
			const mockProcess2 = createMockProcess();
			const mockProcess3 = createMockProcess();

			processManager.register('process-1', mockProcess1);
			processManager.register('process-2', mockProcess2);
			processManager.register('process-3', mockProcess3);

			expect(processManager.getProcessCount()).toBe(3);
		});
	});

	describe('cleanup', () => {
		it('should kill and remove a specific process', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-cleanup';

			processManager.register(processId, mockProcess);
			processManager.cleanup(processId);

			expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
			expect(processManager.hasProcess(processId)).toBe(false);
		});

		it('should handle cleanup of non-existent process', () => {
			// Should not throw
			expect(() => processManager.cleanup('non-existent')).not.toThrow();
		});

		it('should handle cleanup of already killed process', () => {
			const mockProcess = createMockProcess();
			// Mark as killed by calling kill first
			mockProcess.kill();
			const processId = 'test-process-already-killed';

			processManager.register(processId, mockProcess);

			// Clear the mock to check if it's called again
			(mockProcess.kill as jest.Mock).mockClear();

			processManager.cleanup(processId);

			// Should not attempt to kill already killed process
			expect(mockProcess.kill).not.toHaveBeenCalled();
			expect(processManager.hasProcess(processId)).toBe(false);
		});
	});

	describe('cleanupAll', () => {
		it('should cleanup all tracked processes', () => {
			const mockProcess1 = createMockProcess();
			const mockProcess2 = createMockProcess();
			const mockProcess3 = createMockProcess();

			processManager.register('process-1', mockProcess1);
			processManager.register('process-2', mockProcess2);
			processManager.register('process-3', mockProcess3);

			expect(processManager.getProcessCount()).toBe(3);

			processManager.cleanupAll();

			expect(mockProcess1.kill).toHaveBeenCalled();
			expect(mockProcess2.kill).toHaveBeenCalled();
			expect(mockProcess3.kill).toHaveBeenCalled();
			expect(processManager.getProcessCount()).toBe(0);
		});

		it('should handle empty process list', () => {
			expect(() => processManager.cleanupAll()).not.toThrow();
		});
	});

	describe('getProcess', () => {
		it('should return the process for a given ID', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-get';

			processManager.register(processId, mockProcess);

			const retrieved = processManager.getProcess(processId);
			expect(retrieved).toBe(mockProcess);
		});

		it('should return undefined for non-existent process', () => {
			const retrieved = processManager.getProcess('non-existent');
			expect(retrieved).toBeUndefined();
		});
	});

	describe('timeout functionality', () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('should kill process after default timeout', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-timeout';

			processManager.register(processId, mockProcess);
			expect(processManager.hasProcess(processId)).toBe(true);

			// Fast-forward time by 5 minutes (default timeout)
			jest.advanceTimersByTime(5 * 60 * 1000);

			expect(mockProcess.kill).toHaveBeenCalled();
		});

		it('should kill process after custom timeout', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-custom-timeout';
			const customTimeout = 30000; // 30 seconds

			processManager.register(processId, mockProcess, { timeout: customTimeout });
			expect(processManager.hasProcess(processId)).toBe(true);

			// Fast-forward time by 30 seconds
			jest.advanceTimersByTime(customTimeout);

			expect(mockProcess.kill).toHaveBeenCalled();
		});

		it('should not timeout when disabled', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-no-timeout';

			processManager.register(processId, mockProcess, { enabled: false });
			expect(processManager.hasProcess(processId)).toBe(true);

			// Fast-forward time by 10 minutes
			jest.advanceTimersByTime(10 * 60 * 1000);

			expect(mockProcess.kill).not.toHaveBeenCalled();
		});

		it('should clear timeout when process exits naturally', () => {
			const mockProcess = createMockProcess();
			const processId = 'test-process-natural-exit';

			processManager.register(processId, mockProcess);

			// Clear the mock to track only new calls
			(mockProcess.kill as jest.Mock).mockClear();

			// Process exits before timeout
			mockProcess.emit('exit', 0);

			// Fast-forward time by 10 minutes
			jest.advanceTimersByTime(10 * 60 * 1000);

			// Should not be killed by timeout since it already exited
			expect(mockProcess.kill).not.toHaveBeenCalled();
		});

		it('should allow setting default timeout', () => {
			const newTimeout = 60000; // 1 minute
			processManager.setDefaultTimeout(newTimeout);

			expect(processManager.getDefaultTimeout()).toBe(newTimeout);

			// Reset to default
			processManager.setDefaultTimeout(5 * 60 * 1000);
		});
	});
});

