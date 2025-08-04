import { initializeCanvas } from './canvas.js';
import { initializeCollaboration } from './collaboration.js';
import { initializeUI } from './ui.js';

document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initializeCollaboration();
    initializeUI();
});