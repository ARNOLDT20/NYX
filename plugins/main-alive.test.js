const { cmd } = require('../../command');
const os = require('os');

// Mock dependencies
jest.mock('../../command', () => ({
    cmd: jest.fn(),
    commands: []
}));

jest.mock('../../lib/functions', () => ({
    runtime: jest.fn(() => '1h 20m 30s'),
    getBuffer: jest.fn()
}));

jest.mock('../../config', () => ({
    BOT_NAME: 'NYX Test',
    OWNER_NAME: 'Tester',
    PREFIX: '.',
    ALIVE_IMG: 'https://example.com/alive.jpg',
    MENU_IMAGE_URL: 'https://example.com/menu.jpg',
    GROUP_LINK: 'https://chat.whatsapp.com/group',
    CHANNEL_LINK: 'https://whatsapp.com/channel'
}));

describe('main-alive.js', () => {
    let aliveHandler;
    let mockConn;
    let mockMek;
    let mockReply;

    beforeAll(() => {
        // Require the plugin file to trigger the cmd registration
        require('../../plugins/main-alive');

        // Capture the handler function passed to cmd
        // cmd is called with (options, handler)
        aliveHandler = cmd.mock.calls[0][1];
    });

    beforeEach(() => {
        // Reset mocks before each test
        mockConn = {
            sendMessage: jest.fn().mockResolvedValue(true)
        };
        mockMek = { key: { id: 'test-msg-id' } };
        mockReply = jest.fn();

        jest.clearAllMocks();

        // Mock OS and Process methods used in the command
        jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
        jest.spyOn(os, 'release').mockReturnValue('10.0.19043');
        jest.spyOn(os, 'arch').mockReturnValue('x64');
        jest.spyOn(os, 'cpus').mockReturnValue([{ model: 'Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz' }]);

        jest.spyOn(process, 'uptime').mockReturnValue(4800); // 80 minutes
        jest.spyOn(process, 'memoryUsage').mockReturnValue({
            heapUsed: 50 * 1024 * 1024, // 50 MB
            heapTotal: 100 * 1024 * 1024 // 100 MB
        });
    });

    test('should register the alive command with correct properties', () => {
        expect(cmd).toHaveBeenCalledWith(
            expect.objectContaining({
                pattern: 'alive',
                alias: ['status', 'live'],
                desc: 'Check uptime and system status',
                category: 'main',
                react: '🟢'
            }),
            expect.any(Function)
        );
    });

    test('should send alive message with image when ALIVE_IMG is set', async () => {
        await aliveHandler(mockConn, mockMek, {}, { from: 'jid', sender: 'sender', reply: mockReply });

        expect(mockConn.sendMessage).toHaveBeenCalledTimes(1);
        const args = mockConn.sendMessage.mock.calls[0];

        // Check destination
        expect(args[0]).toBe('jid');

        // Check content
        expect(args[1]).toHaveProperty('image');
        expect(args[1].image).toEqual({ url: 'https://example.com/alive.jpg' });
        expect(args[1].caption).toContain('NYX Test');
        expect(args[1].caption).toContain('Uptime: 1h 20m 30s');
        expect(args[1].caption).toContain('Memory: 50.00MB / 100.00MB');
    });

    test('should fallback to text message if sending image fails', async () => {
        // Simulate image send failure
        mockConn.sendMessage.mockRejectedValueOnce(new Error('Network Error'));

        await aliveHandler(mockConn, mockMek, {}, { from: 'jid', sender: 'sender', reply: mockReply });

        // Should attempt image first, then text
        expect(mockConn.sendMessage).toHaveBeenCalledTimes(2);

        const fallbackArgs = mockConn.sendMessage.mock.calls[1];
        expect(fallbackArgs[1]).not.toHaveProperty('image');
        expect(fallbackArgs[1]).toHaveProperty('text');
        expect(fallbackArgs[1].text).toContain('NYX Test');
    });

    test('should handle unexpected errors and reply', async () => {
        // Simulate an error within the logic (e.g. process.memoryUsage fails)
        jest.spyOn(process, 'memoryUsage').mockImplementation(() => { throw new Error('Fatal Error'); });

        await aliveHandler(mockConn, mockMek, {}, { from: 'jid', sender: 'sender', reply: mockReply });

        expect(mockReply).toHaveBeenCalledWith('An error occurred: Fatal Error');
    });
});