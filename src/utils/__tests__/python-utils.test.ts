import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createChildProcess, getFileNameFromPath, mapPythonError, pythonErrorMap } from '../python-utils';
import { ChildProcess } from 'child_process';

// Mock child_process
jest.mock('child_process');

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

describe('python-utils', () => {
	describe('pythonErrorMap', () => {
		it('should contain common Python error mappings', () => {
			expect(pythonErrorMap['SyntaxError']).toBe('Syntax\nError');
			expect(pythonErrorMap['NameError']).toBe('Undefined\nVariable');
			expect(pythonErrorMap['TypeError']).toBe('Type\nError');
			expect(pythonErrorMap['ValueError']).toBe('Invalid\nValue');
		});

		it('should contain file-related error mappings', () => {
			expect(pythonErrorMap['No such file or directory']).toBe('Script\nNot Found');
			expect(pythonErrorMap['ModuleNotFoundError']).toBe('Module\nMissing');
		});

		it('should contain Microsoft Store error mapping', () => {
			expect(pythonErrorMap['Microsoft Store']).toBe('Python\nAlias Issue');
		});
	});

	describe('getFileNameFromPath', () => {
		it('should extract filename from Unix-style path', () => {
			expect(getFileNameFromPath('/path/to/script.py')).toBe('script.py');
		});

		it('should extract filename from Windows-style path', () => {
			expect(getFileNameFromPath('C:\\Users\\test\\script.py')).toBe('script.py');
		});

		it('should handle filename without path', () => {
			expect(getFileNameFromPath('script.py')).toBe('script.py');
		});

		it('should handle paths with multiple extensions', () => {
			expect(getFileNameFromPath('/path/to/my.script.py')).toBe('my.script.py');
		});
	});

	describe('mapPythonError', () => {
		it('should map known Python errors', () => {
			expect(mapPythonError('SyntaxError: invalid syntax')).toBe('Syntax\nError');
			expect(mapPythonError('NameError: name "x" is not defined')).toBe('Undefined\nVariable');
			expect(mapPythonError('TypeError: unsupported operand type(s)')).toBe('Type\nError');
		});

		it('should map file errors', () => {
			expect(mapPythonError('No such file or directory: script.py')).toBe('Script\nNot Found');
			expect(mapPythonError('ModuleNotFoundError: No module named "requests"')).toBe('Module\nMissing');
		});

		it('should return default error for unknown errors', () => {
			expect(mapPythonError('Some unknown error message')).toBe('Python\nError');
		});

		it('should handle empty error strings', () => {
			expect(mapPythonError('')).toBe('Python\nError');
		});

		it('should be case-sensitive for error matching', () => {
			expect(mapPythonError('syntaxerror: invalid syntax')).toBe('Python\nError');
		});

		it('should map Python installation errors', () => {
			expect(mapPythonError('python was not found')).toBe('Python\nMissing');
			expect(mapPythonError('is not recognized')).toBe('Python\nNot in PATH');
			expect(mapPythonError('Microsoft Store')).toBe('Python\nAlias Issue');
		});
	});

	describe('createChildProcess', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should be tested with proper mocking', () => {
			// Note: Full testing of createChildProcess requires mocking the spawn function
			// and os.platform(), which is complex. This is a placeholder for future implementation.
			expect(createChildProcess).toBeDefined();
			expect(typeof createChildProcess).toBe('function');
		});

		// Additional tests would require:
		// - Mocking os.platform() to test Windows vs Unix behavior
		// - Mocking spawn() to verify correct arguments
		// - Testing venv vs non-venv paths
		// - Testing error handling
	});
});

