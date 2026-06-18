const socketUrl = localStorage.getItem('desmoche_socketUrl') || 'http://localhost:3000';
const socket = io(socketUrl);

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('error', ({ message }) => {
    console.error('Socket error:', message);
});

export default socket;
