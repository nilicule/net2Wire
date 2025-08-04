// collaboration.js - Socket.IO collaboration features and user management

let socket = null;
let currentUser = null;
let connectedUsers = new Map();
let lastMousePosition = { x: 0, y: 0 };

// Initialize Socket.IO connection
export function initializeCollaboration(ROOM_ID, IS_NEW_ROOM) {
    const basePath = window.BASE_PATH || '';
    const socketPath = basePath ? `${basePath}/socket.io/` : '/socket.io/';
    socket = io({
        path: socketPath
    });

    // Connection events
    socket.on('connect', function() {
        console.log('Connected to collaboration server');
        console.log('Socket connection details:', { 
            ROOM_ID, 
            IS_NEW_ROOM, 
            currentPath: window.location.pathname 
        });
        
        // Join the room after connecting
        socket.emit('join_room', { room_id: ROOM_ID });
        
        // Note: Room redirect is now handled server-side in Flask
    });

    socket.on('disconnect', function() {
        console.log('Disconnected from collaboration server');
    });

    // User events
    socket.on('user_info', function(data) {
        currentUser = data;
        console.log('Current user:', currentUser);
        updateUsersDisplay();
    });

    socket.on('user_joined', function(data) {
        console.log('User joined:', data);
        connectedUsers.set(data.session_id, data);
        createUserCursor(data);
        updateUsersDisplay();
    });

    socket.on('user_left', function(data) {
        console.log('User left:', data);
        connectedUsers.delete(data.session_id);
        removeUserCursor(data.session_id);
        updateUsersDisplay();
    });

    socket.on('current_users', function(data) {
        console.log('Current users:', data);
        data.users.forEach(user => {
            connectedUsers.set(user.session_id, user);
            createUserCursor(user);
        });
        updateUsersDisplay();
    });

    // Mouse tracking events
    socket.on('user_mouse_move', function(data) {
        updateUserCursor(data.session_id, data.x, data.y);
    });

    // Shape collaboration events
    socket.on('shape_created', function(data) {
        console.log('🟢 RECEIVE shape_created:', data);
        try {
            createShapeFromCollaboration(data);
            console.log('✅ Successfully created collaborative shape:', data.id);
        } catch (error) {
            console.error('❌ Error creating collaborative shape:', error, data);
        }
    });

    socket.on('shape_updated', function(data) {
        console.log('🟡 RECEIVE shape_updated:', data);
        try {
            updateShapeFromCollaboration(data);
            console.log('✅ Successfully updated collaborative shape:', data.id);
        } catch (error) {
            console.error('❌ Error updating collaborative shape:', error, data);
        }
    });

    socket.on('shape_deleted', function(data) {
        console.log('🔴 RECEIVE shape_deleted:', data);
        try {
            deleteShapeFromCollaboration(data);
            console.log('✅ Successfully deleted collaborative shape:', data.id);
        } catch (error) {
            console.error('❌ Error deleting collaborative shape:', error, data);
        }
    });

    socket.on('canvas_cleared', function(data) {
        clearCanvasFromCollaboration();
    });

    socket.on('load_shapes', function(data) {
        loadShapesFromCollaboration(data.shapes);
    });

    // Chat events
    socket.on('chat_message', function(data) {
        displayChatMessage(data);
    });
}

// Mouse tracking
export function startMouseTracking() {
    const canvas = document.getElementById('canvas');
    
    document.addEventListener('mousemove', function(e) {
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
        // Only send if position changed significantly (throttle)
        if (Math.abs(x - lastMousePosition.x) > 5 || Math.abs(y - lastMousePosition.y) > 5) {
            lastMousePosition = { x, y };
            if (socket) {
                socket.emit('mouse_move', { x, y });
            }
        }
    });
}

// User cursor management
function createUserCursor(user) {
    const existingCursor = document.getElementById(`cursor-${user.session_id}`);
    if (existingCursor) return;

    const cursor = document.createElement('div');
    cursor.id = `cursor-${user.session_id}`;
    cursor.className = 'user-cursor';
    cursor.style.color = user.color;
    cursor.innerHTML = `
        ↖
        <div class="user-label" style="background: ${user.color}; color: white;">
            ${user.user_id}
        </div>
    `;
    cursor.style.left = `${user.mouse_x || 0}px`;
    cursor.style.top = `${user.mouse_y || 0}px`;
    
    document.body.appendChild(cursor);
}

function updateUserCursor(sessionId, x, y) {
    const cursor = document.getElementById(`cursor-${sessionId}`);
    if (cursor) {
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        cursor.style.left = `${canvasRect.left + x}px`;
        cursor.style.top = `${canvasRect.top + y}px`;
    }
}

function removeUserCursor(sessionId) {
    const cursor = document.getElementById(`cursor-${sessionId}`);
    if (cursor) {
        cursor.remove();
    }
}

// Users display
function updateUsersDisplay() {
    const usersContainer = document.getElementById('users-container');
    const usersIndicator = document.getElementById('users-indicator');
    const userCount = document.getElementById('user-count');
    
    if (!usersContainer) return;

    usersContainer.innerHTML = '';
    let totalUsers = 0;
    
    if (currentUser) {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-color-dot" style="background: ${currentUser.color};"></div>
            <span>${currentUser.user_id} (You)</span>
        `;
        usersContainer.appendChild(userItem);
        totalUsers++;
    }

    connectedUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-color-dot" style="background: ${user.color};"></div>
            <span>${user.user_id}</span>
        `;
        usersContainer.appendChild(userItem);
        totalUsers++;
    });

    // Update user count
    if (userCount) {
        userCount.textContent = totalUsers;
    }

    // Show/hide users indicator
    if (totalUsers > 0) {
        usersIndicator.style.display = 'flex';
    } else {
        usersIndicator.style.display = 'none';
    }
}

// Shape collaboration
function createShapeFromCollaboration(data) {
    console.log('Received shape_created:', data);
    
    // Don't create if shape already exists
    if (document.getElementById(data.id)) {
        console.log('Shape already exists:', data.id);
        return;
    }
    
    console.log('Creating shape from collaboration:', data);
    
    // Create shape directly with exact data instead of using createShape()
    const shape = document.createElement('div');
    shape.className = 'shape';
    shape.id = data.id;
    shape.setAttribute('data-type', data.type);
    
    // Set exact position and size from collaboration data
    shape.style.position = 'absolute';
    shape.style.left = data.x + 'px';
    shape.style.top = data.y + 'px';
    shape.style.width = data.width + 'px';
    shape.style.height = data.height + 'px';
    
    // Apply the same styling logic as createShape but use collaborative content
    applyCollaborativeShapeContent(shape, data);
    
    // Add event listeners
    addCollaborativeShapeEventListeners(shape);
    
    // Add to canvas
    const canvas = document.getElementById('canvas');
    canvas.appendChild(shape);
    
    console.log('Successfully created collaborative shape:', data.id, 'at', data.x, data.y);
}

function applyCollaborativeShapeContent(shape, data) {
    switch(data.type) {
        case 'image':
            shape.classList.add('image-shape');
            if (data.content) {
                shape.innerHTML = data.content;
            } else {
                shape.innerHTML = `
                    <div class="image-placeholder">
                        <div class="image-icon">🖼️</div>
                        <div style="font-size: 10px;">Image</div>
                    </div>
                `;
            }
            break;
        case 'rectangle':
            shape.classList.add('box-shape');
            if (data.content) {
                shape.innerHTML = data.content;
            }
            break;
        case 'icon':
            shape.classList.add('box-shape');
            shape.classList.add('icon-shape');
            shape.innerHTML = data.content || '⭐';
            break;
        case 'button':
            shape.classList.add('box-shape');
            shape.style.background = '#007bff';
            shape.style.color = 'white';
            shape.style.border = 'none';
            const buttonText = data.content || 'Button';
            shape.innerHTML = '<div style="text-align: center; line-height: ' + data.height + 'px; font-size: 14px;">' + buttonText + '</div>';
            break;
        case 'dropdown':
            shape.classList.add('box-shape');
            shape.style.border = '2px solid #ddd';
            const dropdownContent = data.content || '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px;"><span>Select option</span><span>▼</span></div>';
            shape.innerHTML = dropdownContent;
            break;
        case 'checkbox':
            shape.classList.add('box-shape');
            const checkboxContent = data.content || '<div style="display: flex; align-items: center; gap: 8px; padding: 8px;"><span style="width: 16px; height: 16px; border: 2px solid #999; display: inline-block;"></span><span>Checkbox</span></div>';
            shape.innerHTML = checkboxContent;
            break;
        case 'radio':
            shape.classList.add('box-shape');
            const radioContent = data.content || '<div style="display: flex; align-items: center; gap: 8px; padding: 8px;"><span style="width: 16px; height: 16px; border: 2px solid #999; border-radius: 50%; display: inline-block;"></span><span>Radio Button</span></div>';
            shape.innerHTML = radioContent;
            break;
        case 'block-text':
            shape.classList.add('text-shape');
            const textarea = document.createElement('textarea');
            textarea.className = 'text-input';
            textarea.value = data.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...';
            textarea.style.fontSize = '14px';
            textarea.style.lineHeight = '1.5';
            textarea.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    this.value = 'Lorem ipsum dolor sit amet...';
                }
            });
            textarea.addEventListener('input', function() {
                // Emit content updates when text changes
                setTimeout(() => emitShapeUpdated(shape), 300);
            });
            shape.appendChild(textarea);
            break;
        case 'text-input':
            shape.classList.add('text-shape');
            shape.style.border = '2px solid #ddd';
            shape.style.borderRadius = '4px';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.value = data.content || 'Enter text...';
            input.style.border = 'none';
            input.style.background = 'transparent';
            input.style.width = '100%';
            input.style.height = '100%';
            input.style.padding = '8px';
            input.addEventListener('input', function() {
                // Emit content updates when text changes
                setTimeout(() => emitShapeUpdated(shape), 300);
            });
            shape.appendChild(input);
            break;
        case 'block-headline':
            shape.classList.add('text-shape');
            const headlineText = data.content || 'Headline';
            shape.innerHTML = '<div style="font-size: 24px; font-weight: bold; line-height: ' + data.height + 'px; text-align: center;">' + headlineText + '</div>';
            break;
        default:
            shape.classList.add('box-shape');
            if (data.content) {
                shape.innerHTML = data.content;
            } else {
                // Import pageElements from shapes module
                import('./shapes.js').then(shapesModule => {
                    const allElements = [...shapesModule.pageElements.elements, ...shapesModule.pageElements.sections];
                    const displayName = allElements.find(el => el.type === data.type)?.name || data.type;
                    shape.innerHTML = '<div style="text-align: center; line-height: ' + data.height + 'px; color: #999; font-size: 12px;">' + displayName + '</div>';
                });
            }
            break;
    }
}

function addCollaborativeShapeEventListeners(shape) {
    shape.addEventListener('click', function(event) {
        import('./canvas.js').then(canvasModule => {
            canvasModule.selectShape(event);
        });
    });
    
    shape.addEventListener('dblclick', function(event) {
        event.stopPropagation();
        import('./shapes.js').then(shapesModule => {
            shapesModule.handleShapeDoubleClick(shape, event);
        });
    });
    
    shape.addEventListener('mousedown', function(event) {
        import('./canvas.js').then(canvasModule => {
            canvasModule.startShapeDrag(event);
        });
    });
}

function setShapeContent(shape, content, type) {
    if (!content) return;
    
    switch(type) {
        case 'block-text':
        case 'text-input':
            const textElement = shape.querySelector('.text-input, input, textarea');
            if (textElement && document.activeElement !== textElement) {
                // Only update if user isn't currently typing
                textElement.value = content;
            }
            break;
        case 'block-headline':
            const headlineElement = shape.querySelector('div');
            if (headlineElement) {
                headlineElement.textContent = content;
            }
            break;
        default:
            // For other shapes, update innerHTML if different
            if (shape.innerHTML !== content) {
                shape.innerHTML = content;
            }
            break;
    }
}

function updateShapeFromCollaboration(data) {
    const shape = document.getElementById(data.id);
    
    // Import canvas module to check selected shape
    import('./canvas.js').then(canvasModule => {
        const selectedShape = canvasModule.getSelectedShape();
        
        if (shape && shape !== selectedShape) { // Don't update if user is currently editing
            // Update position and size
            shape.style.left = data.x + 'px';
            shape.style.top = data.y + 'px';
            shape.style.width = data.width + 'px';
            shape.style.height = data.height + 'px';
            
            // Update content if provided
            if (data.content !== undefined) {
                setShapeContent(shape, data.content, data.type);
            }
        }
    });
}

function deleteShapeFromCollaboration(data) {
    const shape = document.getElementById(data.id);
    if (shape) {
        shape.remove();
    }
}

function clearCanvasFromCollaboration() {
    // Clear all shapes from canvas without emitting another event
    document.querySelectorAll('.shape:not(.drawing-shape)').forEach(shape => {
        shape.remove();
    });
    
    // Update canvas state
    import('./canvas.js').then(canvasModule => {
        canvasModule.setSelectedShape(null);
        canvasModule.updatePositionInfo();
    });
    
    console.log('Canvas cleared by remote user');
}

function loadShapesFromCollaboration(shapes) {
    // Clear existing shapes and load from server (without emitting)
    clearCanvasFromCollaboration();
    shapes.forEach(shapeData => {
        createShapeFromCollaboration(shapeData);
    });
}

// Emit shape events
function getShapeContent(shape) {
    const type = shape.getAttribute('data-type');
    let content = null;
    
    switch(type) {
        case 'block-text':
        case 'text-input':
            const textElement = shape.querySelector('.text-input, input, textarea');
            if (textElement) {
                content = textElement.value || textElement.textContent;
            }
            break;
        case 'block-headline':
            const headlineElement = shape.querySelector('div');
            if (headlineElement) {
                content = headlineElement.textContent;
            }
            break;
        default:
            // For other shapes, get the innerHTML
            content = shape.innerHTML;
            break;
    }
    
    return content;
}

export function emitShapeCreated(shape) {
    if (socket && socket.connected && !window.skipEmit) {
        const shapeData = {
            id: shape.id,
            type: shape.getAttribute('data-type'),
            x: parseInt(shape.style.left) || 0,
            y: parseInt(shape.style.top) || 0,
            width: shape.offsetWidth,
            height: shape.offsetHeight,
            content: getShapeContent(shape)
        };
        console.log('🟢 EMIT shape_created:', shapeData);
        socket.emit('shape_created', shapeData);
    } else {
        console.log('🔴 SKIP emit:', { 
            socketExists: !!socket, 
            connected: socket?.connected, 
            skipEmit: window.skipEmit 
        });
    }
}

export function emitShapeUpdated(shape) {
    if (socket && socket.connected && !window.skipEmit) {
        const updateData = {
            id: shape.id,
            type: shape.getAttribute('data-type'),
            x: parseInt(shape.style.left) || 0,
            y: parseInt(shape.style.top) || 0,
            width: shape.offsetWidth,
            height: shape.offsetHeight,
            content: getShapeContent(shape)
        };
        console.log('🟡 EMIT shape_updated:', updateData);
        socket.emit('shape_updated', updateData);
    } else {
        console.log('🔴 SKIP update emit:', { 
            socketExists: !!socket, 
            connected: socket?.connected, 
            skipEmit: window.skipEmit,
            shapeId: shape?.id 
        });
    }
}

export function emitShapeDeleted(shape) {
    if (socket && socket.connected && !window.skipEmit) {
        const deleteData = {
            id: shape.id
        };
        console.log('🔴 EMIT shape_deleted:', deleteData);
        socket.emit('shape_deleted', deleteData);
    } else {
        console.log('🔴 SKIP delete emit:', { 
            socketExists: !!socket, 
            connected: socket?.connected, 
            skipEmit: window.skipEmit,
            shapeId: shape?.id 
        });
    }
}

export function emitCanvasClear() {
    if (socket && socket.connected) {
        socket.emit('canvas_cleared', {});
    }
}

// Chat functionality
let chatVisible = false;
let lastMessageTime = 0;
const MESSAGE_THROTTLE = 1000; // 1 second between messages

export function toggleChat() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatVisible = !chatVisible;
        chatContainer.style.display = chatVisible ? 'flex' : 'none';
        
        if (chatVisible) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }
    }
}

export function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput || !socket || !socket.connected) return;
    
    const message = chatInput.value.trim();
    if (!message || message.length > 500) return;
    
    // Rate limiting
    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_THROTTLE) {
        return;
    }
    lastMessageTime = now;
    
    // Send message
    socket.emit('chat_message', { message: message });
    chatInput.value = '';
}

function displayChatMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    const timestamp = new Date(data.timestamp * 1000);
    const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="chat-message-user" style="color: ${data.user_color};">
            ${data.user_id}
        </div>
        <div class="chat-message-content">${data.message}</div>
        <div class="chat-message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show notification if chat is not visible
    if (!chatVisible) {
        showChatNotification();
        showMessagePopup(data);
    }
}

function showChatNotification() {
    const chatBtn = document.getElementById('chat-btn');
    if (chatBtn) {
        chatBtn.classList.add('has-notification');
        setTimeout(() => {
            chatBtn.classList.remove('has-notification');
        }, 5000);
    }
}

function showMessagePopup(data) {
    // Remove any existing popup
    const existingPopup = document.getElementById('message-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'message-popup';
    popup.className = 'message-popup';
    
    // Truncate long messages for preview
    const preview = data.message.length > 80 ? data.message.substring(0, 80) + '...' : data.message;
    
    popup.innerHTML = `
        <div class="message-popup-header">
            <span class="message-popup-user" style="color: ${data.user_color};">💬 ${data.user_id}</span>
            <button class="message-popup-close">×</button>
        </div>
        <div class="message-popup-content">${preview}</div>
        <div class="message-popup-action">Click to open chat</div>
    `;
    
    // Add click handlers
    popup.addEventListener('click', (e) => {
        if (!e.target.classList.contains('message-popup-close')) {
            toggleChat();
            popup.remove();
        }
    });
    
    popup.querySelector('.message-popup-close').addEventListener('click', (e) => {
        e.stopPropagation();
        popup.remove();
    });
    
    // Add to page
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (popup && popup.parentNode) {
            popup.classList.remove('show');
            setTimeout(() => {
                if (popup && popup.parentNode) {
                    popup.remove();
                }
            }, 300);
        }
    }, 8000);
}

export function initializeChatHandlers() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    const sendBtn = document.getElementById('chat-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
    
    const chatBtn = document.getElementById('chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', toggleChat);
    }
    
    const chatClose = document.getElementById('chat-close');
    if (chatClose) {
        chatClose.addEventListener('click', toggleChat);
    }
}

// Export socket for external access
export function getSocket() {
    return socket;
}