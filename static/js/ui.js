// ui.js - UI controls, menu functionality, and file operations

// Initialize UI event handlers
export function initializeUI(ROOM_ID) {
    // Share functionality
    document.getElementById('share-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/room/${ROOM_ID}`;
        
        // Try to use the Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showShareNotification('Share link copied to clipboard!');
            }).catch(() => {
                fallbackCopyToClipboard(shareUrl);
            });
        } else {
            fallbackCopyToClipboard(shareUrl);
        }
    });

    // Menu functionality
    document.getElementById('menu-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('menu-dropdown');
        dropdown.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function() {
        document.getElementById('menu-dropdown').classList.remove('show');
    });

    // Attach menu item handlers
    attachMenuHandlers();
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showShareNotification('Share link copied to clipboard!');
    } catch (err) {
        showShareNotification(`Share URL: ${text}`, 5000);
    }
    
    document.body.removeChild(textArea);
}

// Show share notification
function showShareNotification(message, duration = 3000) {
    // Remove any existing notification
    const existing = document.querySelector('.share-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#share-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'share-notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Attach menu handlers
function attachMenuHandlers() {
    // Find menu items by their onclick attributes or add event listeners
    const menuItems = document.querySelectorAll('#menu-dropdown .menu-item');
    
    menuItems.forEach(item => {
        const onClick = item.getAttribute('onclick');
        if (onClick) {
            // Remove onclick attribute and add proper event listener
            item.removeAttribute('onclick');
            
            if (onClick.includes('saveWireframe')) {
                item.addEventListener('click', saveWireframe);
            } else if (onClick.includes('clearCanvas')) {
                item.addEventListener('click', () => {
                    import('./canvas.js').then(canvasModule => {
                        canvasModule.clearCanvas();
                    });
                });
            }
        }
    });

    // Add file input handler for load wireframe
    const loadInput = document.getElementById('load-wireframe-input');
    if (loadInput) {
        loadInput.addEventListener('change', loadWireframe);
    }
}

// Save wireframe to JSON file
function saveWireframe() {
    const shapes = [];
    document.querySelectorAll('.shape:not(.drawing-shape)').forEach(shape => {
        const shapeData = {
            id: shape.id,
            type: shape.getAttribute('data-type'),
            x: parseInt(shape.style.left) || 0,
            y: parseInt(shape.style.top) || 0,
            width: shape.offsetWidth,
            height: shape.offsetHeight
        };

        // Add text content for text shapes
        if (shapeData.type === 'text') {
            const textarea = shape.querySelector('.text-input');
            shapeData.text = textarea ? textarea.value : '';
        }

        shapes.push(shapeData);
    });

    const canvas = document.getElementById('canvas');
    const wireframe = {
        version: '1.0',
        created: new Date().toISOString(),
        canvas: {
            width: 1024,
            height: canvas.offsetHeight
        },
        shapes: shapes
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(wireframe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wireframe-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close menu
    document.getElementById('menu-dropdown').classList.remove('show');
}

// Load wireframe from JSON file
function loadWireframe(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const wireframe = JSON.parse(e.target.result);
            
            // Clear existing shapes
            import('./canvas.js').then(canvasModule => {
                canvasModule.clearCanvas();
                
                // Recreate shapes from saved data
                import('./shapes.js').then(shapesModule => {
                    wireframe.shapes.forEach(shapeData => {
                        shapesModule.createShapeFromData(shapeData);
                    });
                });
            });

            console.log('Wireframe loaded successfully');
        } catch (error) {
            alert('Error loading wireframe file: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Close menu
    document.getElementById('menu-dropdown').classList.remove('show');
    
    // Reset file input
    event.target.value = '';
}

// Shape type selector functionality
export function showShapeTypeSelector(x, y, width, height) {
    // Create simple type selector popup
    const selector = document.createElement('div');
    selector.className = 'type-selector-popup';
    selector.innerHTML = `
        <div class="type-options">
            <button class="type-option" data-type="image">
                <span>🖼️</span> Image
            </button>
            <button class="type-option" data-type="rectangle">
                <span>⬛</span> Box
            </button>
            <button class="type-option" data-type="block-text">
                <span>📝</span> Text
            </button>
            <button class="type-option hamburger-option" onclick="expandToFullPicker(this.closest('.type-selector-popup'), ${x}, ${y}, ${width}, ${height});">
                <span>☰</span>
            </button>
        </div>
    `;
    
    const canvas = document.getElementById('canvas');
    
    // Position the selector above the drawn shape
    const canvasRect = canvas.getBoundingClientRect();
    selector.style.left = (x + width/2) + 'px';
    selector.style.top = (y - 50) + 'px';
    selector.style.transform = 'translateX(-50%)';
    
    // Make sure it doesn't go off screen
    canvas.appendChild(selector);
    
    // Adjust position if it goes off the left or right edge
    const selectorRect = selector.getBoundingClientRect();
    const canvasLeft = canvasRect.left;
    const canvasRight = canvasRect.right;
    
    if (selectorRect.left < canvasLeft) {
        selector.style.left = '10px';
        selector.style.transform = 'none';
    } else if (selectorRect.right > canvasRight) {
        selector.style.left = (canvas.offsetWidth - selector.offsetWidth - 10) + 'px';
        selector.style.transform = 'none';
    }
    
    // If it goes above the canvas, put it below the shape instead
    if (y - 50 < 0) {
        selector.style.top = (y + height + 10) + 'px';
    }
    
    // Handle type selection
    selector.querySelectorAll('.type-option[data-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            const selectedType = this.dataset.type;
            selector.remove();
            import('./shapes.js').then(shapesModule => {
                shapesModule.createShape(selectedType, x, y, width, height);
            });
        });
    });
    
    // Close on outside click
    let ignoreFirstClick = true;
    function closeSelector(e) {
        if (ignoreFirstClick) {
            ignoreFirstClick = false;
            return;
        }
        
        if (!selector.contains(e.target)) {
            // Prevent the canvas from starting a new shape
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Remove the drawing shape if cancelled
            const drawingShapes = document.querySelectorAll('.drawing-shape');
            drawingShapes.forEach(shape => shape.remove());
            selector.remove();
            document.removeEventListener('click', closeSelector, true);
            document.removeEventListener('mousedown', closeSelector, true);
            
            import('./canvas.js').then(canvasModule => {
                canvasModule.updatePositionInfo();
            });
            
            return false;
        }
    }
    
    // Add the event listener for both click and mousedown to catch canvas events
    document.addEventListener('click', closeSelector, true);
    document.addEventListener('mousedown', closeSelector, true);
}

// Full element picker functionality
export function showFullElementPicker(shape, x, y, width, height) {
    // Create comprehensive element picker
    const picker = document.createElement('div');
    picker.className = 'element-picker';
    
    import('./shapes.js').then(shapesModule => {
        const pageElements = shapesModule.pageElements;
        
        picker.innerHTML = `
            <div class="element-search">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Search elements and sections..." />
            </div>
            <div class="element-list">
                <div class="element-category">Elements</div>
                ${pageElements.elements.map(element => `
                    <button class="element-item" data-type="${element.type}" data-category="elements">
                        <span class="element-icon">${element.icon}</span>
                        <span class="element-name">${element.name}</span>
                    </button>
                `).join('')}
                
                <div class="element-category">Sections</div>
                ${pageElements.sections.map(element => `
                    <button class="element-item" data-type="${element.type}" data-category="sections">
                        <span class="element-icon">${element.icon}</span>
                        <span class="element-name">${element.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(picker);
        
        setupElementPicker(picker, shape, x, y, width, height);
    });
}

function setupElementPicker(picker, shape, x, y, width, height) {
    // Get search input and element list
    const searchInput = picker.querySelector('.search-input');
    const elementItems = picker.querySelectorAll('.element-item');
    
    // Implement search functionality with category handling
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const categories = picker.querySelectorAll('.element-category');
        
        // Handle search filtering
        if (searchTerm === '') {
            // Show all items and categories
            elementItems.forEach(item => item.classList.remove('hidden'));
            categories.forEach(cat => cat.style.display = 'block');
        } else {
            // Filter items
            let hasElementsVisible = false;
            let hasSectionsVisible = false;
            
            elementItems.forEach(item => {
                const elementName = item.querySelector('.element-name').textContent.toLowerCase();
                const category = item.dataset.category;
                
                if (elementName.includes(searchTerm)) {
                    item.classList.remove('hidden');
                    if (category === 'elements') hasElementsVisible = true;
                    if (category === 'sections') hasSectionsVisible = true;
                } else {
                    item.classList.add('hidden');
                }
            });
            
            // Show/hide category headers based on whether they have visible items
            categories.forEach(cat => {
                if (cat.textContent === 'Elements') {
                    cat.style.display = hasElementsVisible ? 'block' : 'none';
                } else if (cat.textContent === 'Sections') {
                    cat.style.display = hasSectionsVisible ? 'block' : 'none';
                }
            });
        }
    });
    
    // Focus search input
    setTimeout(() => searchInput.focus(), 100);
    
    // Handle element selection
    elementItems.forEach(item => {
        item.addEventListener('click', function() {
            const newType = this.dataset.type;
            picker.remove();
            
            if (shape) {
                // Changing existing shape type
                import('./shapes.js').then(shapesModule => {
                    shapesModule.changeShapeType(shape, newType);
                });
            } else {
                // Creating new shape
                import('./shapes.js').then(shapesModule => {
                    shapesModule.createShape(newType, x, y, width, height);
                });
            }
        });
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            picker.remove();
            if (!shape) {
                // Remove the drawing shape if cancelled
                const drawingShapes = document.querySelectorAll('.drawing-shape');
                drawingShapes.forEach(shape => shape.remove());
                import('./canvas.js').then(canvasModule => {
                    canvasModule.updatePositionInfo();
                });
            }
        }
    });
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closePicker(e) {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', closePicker);
                
                if (!shape) {
                    // Remove the drawing shape if cancelled
                    const drawingShapes = document.querySelectorAll('.drawing-shape');
                    drawingShapes.forEach(shape => shape.remove());
                    import('./canvas.js').then(canvasModule => {
                        canvasModule.updatePositionInfo();
                    });
                }
            }
        });
    }, 100);
}

// Expand to full picker functionality
export function expandToFullPicker(selectorElement, x, y, width, height) {
    // Store original dimensions and position
    const originalRect = selectorElement.getBoundingClientRect();
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    import('./shapes.js').then(shapesModule => {
        const pageElements = shapesModule.pageElements;
        
        // Create the expanded picker content
        const expandedContent = `
            <div class="element-search" style="opacity: 0; transition: opacity 0.3s ease 0.2s; padding: 15px; padding-bottom: 10px;">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Search elements and sections..." />
            </div>
            <div class="element-list" style="opacity: 0; transition: opacity 0.3s ease 0.2s; overflow-y: auto; height: calc(100% - 70px); padding: 0 10px 10px 10px;">
                <div class="element-category">Elements</div>
                ${pageElements.elements.map(element => `
                    <button class="element-item" data-type="${element.type}" data-category="elements">
                        <span class="element-icon">${element.icon}</span>
                        <span class="element-name">${element.name}</span>
                    </button>
                `).join('')}
                
                <div class="element-category">Sections</div>
                ${pageElements.sections.map(element => `
                    <button class="element-item" data-type="${element.type}" data-category="sections">
                        <span class="element-icon">${element.icon}</span>
                        <span class="element-name">${element.name}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        // Animate to expanded size
        selectorElement.style.width = '320px';
        selectorElement.style.height = '350px';
        selectorElement.style.padding = '0';
        selectorElement.style.borderRadius = '8px';
        selectorElement.style.overflow = 'hidden';
        selectorElement.style.boxSizing = 'border-box';
        
        // Replace content after a short delay
        setTimeout(() => {
            selectorElement.innerHTML = expandedContent;
            
            // Fade in the new content
            setTimeout(() => {
                const searchDiv = selectorElement.querySelector('.element-search');
                const listDiv = selectorElement.querySelector('.element-list');
                if (searchDiv) searchDiv.style.opacity = '1';
                if (listDiv) listDiv.style.opacity = '1';
            }, 50);
        }, 150);
        
        // Set up the expanded picker functionality
        setTimeout(() => {
            setupExpandedPicker(selectorElement, x, y, width, height);
        }, 200);
    });
}

function setupExpandedPicker(picker, x, y, width, height) {
    // Get search input and element list
    const searchInput = picker.querySelector('.search-input');
    const elementItems = picker.querySelectorAll('.element-item');
    
    // Implement search functionality with category handling
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const categories = picker.querySelectorAll('.element-category');
        
        // Handle search filtering
        if (searchTerm === '') {
            // Show all items and categories
            elementItems.forEach(item => item.classList.remove('hidden'));
            categories.forEach(cat => cat.style.display = 'block');
        } else {
            // Filter items
            let hasElementsVisible = false;
            let hasSectionsVisible = false;
            
            elementItems.forEach(item => {
                const elementName = item.querySelector('.element-name').textContent.toLowerCase();
                const category = item.dataset.category;
                
                if (elementName.includes(searchTerm)) {
                    item.classList.remove('hidden');
                    if (category === 'elements') hasElementsVisible = true;
                    if (category === 'sections') hasSectionsVisible = true;
                } else {
                    item.classList.add('hidden');
                }
            });
            
            // Show/hide category headers based on whether they have visible items
            categories.forEach(cat => {
                if (cat.textContent === 'Elements') {
                    cat.style.display = hasElementsVisible ? 'block' : 'none';
                } else if (cat.textContent === 'Sections') {
                    cat.style.display = hasSectionsVisible ? 'block' : 'none';
                }
            });
        }
    });
    
    // Focus search input
    setTimeout(() => searchInput.focus(), 100);
    
    // Handle element selection
    elementItems.forEach(item => {
        item.addEventListener('click', function() {
            const selectedType = this.dataset.type;
            picker.remove();
            import('./shapes.js').then(shapesModule => {
                shapesModule.createShape(selectedType, x, y, width, height);
            });
        });
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            picker.remove();
            // Remove the drawing shape if cancelled
            const drawingShapes = document.querySelectorAll('.drawing-shape');
            drawingShapes.forEach(shape => shape.remove());
            import('./canvas.js').then(canvasModule => {
                canvasModule.updatePositionInfo();
            });
        }
    });
    
    // Close on outside click (replace the old event handlers)
    let ignoreFirstClick = true;
    function closePicker(e) {
        if (ignoreFirstClick) {
            ignoreFirstClick = false;
            return;
        }
        
        if (!picker.contains(e.target)) {
            // Prevent the canvas from starting a new shape
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Remove the drawing shape if cancelled
            const drawingShapes = document.querySelectorAll('.drawing-shape');
            drawingShapes.forEach(shape => shape.remove());
            picker.remove();
            document.removeEventListener('click', closePicker, true);
            document.removeEventListener('mousedown', closePicker, true);
            
            import('./canvas.js').then(canvasModule => {
                canvasModule.updatePositionInfo();
            });
            
            return false;
        }
    }
    
    // Add the event listener for both click and mousedown to catch canvas events
    document.addEventListener('click', closePicker, true);
    document.addEventListener('mousedown', closePicker, true);
}

// Make functions available globally for HTML onclick handlers
window.expandToFullPicker = expandToFullPicker;
window.saveWireframe = saveWireframe;