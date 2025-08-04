// canvas.js - Canvas drawing, mouse events, and shape interaction

let selectedShape = null;
let isDrawing = false;
let drawingShape = null;
let startX = 0;
let startY = 0;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let resizeHandle = null;
let originalBounds = null;

const canvas = document.getElementById('canvas');

// Initialize canvas event listeners  
export function initializeCanvas() {
    // Canvas drawing functionality
    canvas.addEventListener('mousedown', function(event) {
        // Only start drawing if clicking on empty canvas (not on existing shapes)
        if (event.target === canvas) {
            startDrawing(event);
        }
    });

    // Track mouse position over canvas
    canvas.addEventListener('mousemove', function(event) {
        if (!isDrawing) {
            const canvasRect = canvas.getBoundingClientRect();
            const x = Math.round(event.clientX - canvasRect.left);
            const y = Math.round(event.clientY - canvasRect.top);
            
            if (selectedShape) {
                const w = selectedShape.offsetWidth;
                const h = selectedShape.offsetHeight;
                document.getElementById('position-info').textContent = `X: ${parseInt(selectedShape.style.left) || 0} px   Y: ${parseInt(selectedShape.style.top) || 0} px   W: ${w} px   H: ${h} px   Mouse: ${x}, ${y}`;
            } else {
                document.getElementById('position-info').textContent = `X: ${x} px   Y: ${y} px   W: 0 px   H: 0 px`;
            }
        }
    });

    // Reset position info when mouse leaves canvas
    canvas.addEventListener('mouseleave', function() {
        if (!isDrawing && !selectedShape) {
            document.getElementById('position-info').textContent = 'X: 0 px   Y: 0 px   W: 0 px   H: 0 px';
        }
    });

    // Click outside to deselect
    canvas.addEventListener('click', function(event) {
        if (event.target === canvas && !isDrawing) {
            document.querySelectorAll('.shape').forEach(s => {
                s.classList.remove('selected');
                removeResizeHandles(s);
            });
            selectedShape = null;
            updatePositionInfo();
        }
    });

    // Delete selected shape with Delete or Backspace key
    document.addEventListener('keydown', function(event) {
        if ((event.key === 'Delete' || event.key === 'Backspace') && selectedShape) {
            // Emit deletion to other users before removing
            import('./collaboration.js').then(collabModule => {
                collabModule.emitShapeDeleted(selectedShape);
            });
            
            removeResizeHandles(selectedShape);
            selectedShape.remove();
            selectedShape = null;
            updatePositionInfo();
        }
    });
}

// Start drawing a new shape
function startDrawing(event) {
    isDrawing = true;
    const canvasRect = canvas.getBoundingClientRect();
    startX = event.clientX - canvasRect.left;
    startY = event.clientY - canvasRect.top;

    // Create a temporary drawing shape
    drawingShape = document.createElement('div');
    drawingShape.className = 'shape drawing-shape';
    drawingShape.style.left = startX + 'px';
    drawingShape.style.top = startY + 'px';
    drawingShape.style.width = '0px';
    drawingShape.style.height = '0px';
    drawingShape.style.border = '2px dashed #007bff';
    drawingShape.style.background = 'rgba(0, 123, 255, 0.1)';
    drawingShape.style.position = 'absolute';
    
    canvas.appendChild(drawingShape);

    document.addEventListener('mousemove', drawShape);
    document.addEventListener('mouseup', finishDrawing);
}

function drawShape(event) {
    if (!isDrawing || !drawingShape) return;

    const canvasRect = canvas.getBoundingClientRect();
    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);

    drawingShape.style.left = left + 'px';
    drawingShape.style.top = top + 'px';
    drawingShape.style.width = width + 'px';
    drawingShape.style.height = height + 'px';

    // Update position info during drawing
    document.getElementById('position-info').textContent = `X: ${Math.round(left)} px   Y: ${Math.round(top)} px   W: ${Math.round(width)} px   H: ${Math.round(height)} px`;
}

function finishDrawing(event) {
    if (!isDrawing || !drawingShape) return;

    document.removeEventListener('mousemove', drawShape);
    document.removeEventListener('mouseup', finishDrawing);

    const width = parseInt(drawingShape.style.width);
    const height = parseInt(drawingShape.style.height);

    // Only show type selector if shape has meaningful size
    if (width > 10 && height > 10) {
        const left = parseInt(drawingShape.style.left);
        const top = parseInt(drawingShape.style.top);
        
        import('./ui.js').then(uiModule => {
            uiModule.showShapeTypeSelector(left, top, width, height);
        });
    } else {
        // Remove shape if too small
        drawingShape.remove();
    }

    isDrawing = false;
    drawingShape = null;
}

// Shape selection
export function selectShape(event) {
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
    
    // Remove selection from all shapes and their resize handles
    document.querySelectorAll('.shape').forEach(s => {
        s.classList.remove('selected');
        removeResizeHandles(s);
    });
    
    // Select this shape
    const shape = event.target.closest('.shape');
    if (shape && !shape.classList.contains('drawing-shape')) {
        shape.classList.add('selected');
        selectedShape = shape;
        addResizeHandles(shape);
        updatePositionInfo();
    }
}

// Shape dragging
export function startShapeDrag(event) {
    if (isDrawing || isResizing) return;
    
    // Don't start dragging if clicking on a text input or resize handle
    if (event.target.classList.contains('text-input') || 
        event.target.classList.contains('resize-handle')) {
        return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const shape = event.target.closest('.shape');
    if (!shape || shape.classList.contains('drawing-shape')) return;
    
    selectedShape = shape;
    shape.classList.add('selected');
    
    const rect = shape.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate offset relative to shape's position within canvas
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
    
    document.addEventListener('mousemove', dragShape);
    document.addEventListener('mouseup', stopShapeDrag);
}

function dragShape(event) {
    if (!selectedShape) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    let newX = event.clientX - canvasRect.left - dragOffset.x;
    let newY = event.clientY - canvasRect.top - dragOffset.y;
    
    // Constrain to canvas boundaries
    newX = Math.max(0, Math.min(newX, canvas.offsetWidth - selectedShape.offsetWidth));
    newY = Math.max(0, Math.min(newY, canvas.offsetHeight - selectedShape.offsetHeight));
    
    selectedShape.style.left = newX + 'px';
    selectedShape.style.top = newY + 'px';
    
    updatePositionInfo();
}

function stopShapeDrag() {
    document.removeEventListener('mousemove', dragShape);
    document.removeEventListener('mouseup', stopShapeDrag);
    
    // Emit shape update to other users after drag
    if (selectedShape) {
        import('./collaboration.js').then(collabModule => {
            collabModule.emitShapeUpdated(selectedShape);
        });
    }
}

// Position info updates
export function updatePositionInfo() {
    if (!selectedShape) {
        document.getElementById('position-info').textContent = 'X: 0 px   Y: 0 px   W: 0 px   H: 0 px';
        return;
    }
    
    const x = parseInt(selectedShape.style.left) || 0;
    const y = parseInt(selectedShape.style.top) || 0;
    const w = selectedShape.offsetWidth;
    const h = selectedShape.offsetHeight;
    
    document.getElementById('position-info').textContent = `X: ${x} px   Y: ${y} px   W: ${w} px   H: ${h} px`;
}

// Resize handles
function addResizeHandles(shape) {
    // Remove any existing handles first
    removeResizeHandles(shape);
    
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    handles.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${direction}`;
        handle.addEventListener('mousedown', function(e) {
            startResize(e, shape, direction);
        });
        shape.appendChild(handle);
    });
}

function removeResizeHandles(shape) {
    const handles = shape.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
}

function startResize(event, shape, direction) {
    event.preventDefault();
    event.stopPropagation();
    
    isResizing = true;
    resizeHandle = direction;
    selectedShape = shape;
    
    // Store original bounds
    const rect = shape.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    originalBounds = {
        left: parseInt(shape.style.left) || 0,
        top: parseInt(shape.style.top) || 0,
        width: shape.offsetWidth,
        height: shape.offsetHeight,
        mouseX: event.clientX,
        mouseY: event.clientY
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function handleResize(event) {
    if (!isResizing || !selectedShape || !originalBounds) return;
    
    const deltaX = event.clientX - originalBounds.mouseX;
    const deltaY = event.clientY - originalBounds.mouseY;
    
    let newLeft = originalBounds.left;
    let newTop = originalBounds.top;
    let newWidth = originalBounds.width;
    let newHeight = originalBounds.height;
    
    // Calculate new dimensions based on resize handle direction
    switch(resizeHandle) {
        case 'nw':
            newLeft = originalBounds.left + deltaX;
            newTop = originalBounds.top + deltaY;
            newWidth = originalBounds.width - deltaX;
            newHeight = originalBounds.height - deltaY;
            break;
        case 'n':
            newTop = originalBounds.top + deltaY;
            newHeight = originalBounds.height - deltaY;
            break;
        case 'ne':
            newTop = originalBounds.top + deltaY;
            newWidth = originalBounds.width + deltaX;
            newHeight = originalBounds.height - deltaY;
            break;
        case 'e':
            newWidth = originalBounds.width + deltaX;
            break;
        case 'se':
            newWidth = originalBounds.width + deltaX;
            newHeight = originalBounds.height + deltaY;
            break;
        case 's':
            newHeight = originalBounds.height + deltaY;
            break;
        case 'sw':
            newLeft = originalBounds.left + deltaX;
            newWidth = originalBounds.width - deltaX;
            newHeight = originalBounds.height + deltaY;
            break;
        case 'w':
            newLeft = originalBounds.left + deltaX;
            newWidth = originalBounds.width - deltaX;
            break;
    }
    
    // Enforce minimum size
    const minSize = 20;
    if (newWidth < minSize) {
        if (resizeHandle.includes('w')) {
            newLeft = originalBounds.left + originalBounds.width - minSize;
        }
        newWidth = minSize;
    }
    if (newHeight < minSize) {
        if (resizeHandle.includes('n')) {
            newTop = originalBounds.top + originalBounds.height - minSize;
        }
        newHeight = minSize;
    }
    
    // Constrain to canvas boundaries
    newLeft = Math.max(0, Math.min(newLeft, canvas.offsetWidth - newWidth));
    newTop = Math.max(0, Math.min(newTop, canvas.offsetHeight - newHeight));
    
    // Apply new dimensions
    selectedShape.style.left = newLeft + 'px';
    selectedShape.style.top = newTop + 'px';
    selectedShape.style.width = newWidth + 'px';
    selectedShape.style.height = newHeight + 'px';
    
    // Update content for text shapes that need to adjust to new size
    updateShapeContentForResize(selectedShape, newWidth, newHeight);
    
    updatePositionInfo();
}

function updateShapeContentForResize(shape, width, height) {
    const shapeType = shape.getAttribute('data-type');
    
    // Update line-height for centered content
    if (shapeType === 'button' || shapeType === 'block-headline') {
        const content = shape.querySelector('div');
        if (content) {
            content.style.lineHeight = height + 'px';
            // Ensure text size adjusts if box gets too small
            const minFontSize = 10;
            const maxFontSize = shapeType === 'button' ? 14 : 24;
            const fontSize = Math.max(minFontSize, Math.min(maxFontSize, height * 0.6));
            content.style.fontSize = fontSize + 'px';
        }
    }
    
    // Update textarea height for text shapes
    if (shapeType === 'block-text') {
        const textarea = shape.querySelector('textarea');
        if (textarea) {
            const padding = 16; // Account for shape padding
            const maxHeight = Math.max(20, height - padding);
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
            textarea.style.maxHeight = maxHeight + 'px';
        }
    }
    
    // Update text input height for single-line text inputs
    if (shapeType === 'text-input') {
        const input = shape.querySelector('input');
        if (input) {
            const padding = 16; // Account for shape padding
            const inputHeight = Math.max(20, height - padding);
            input.style.height = inputHeight + 'px';
            input.style.lineHeight = inputHeight + 'px';
        }
    }
    
    // Update other content types that need size adjustments
    if (shapeType === 'dropdown') {
        const content = shape.querySelector('div');
        if (content) {
            content.style.height = height + 'px';
            content.style.lineHeight = height + 'px';
        }
    }
    
    if (shapeType === 'checkbox' || shapeType === 'radio') {
        const content = shape.querySelector('div');
        if (content) {
            content.style.height = height + 'px';
            content.style.lineHeight = height + 'px';
            // Adjust checkbox/radio size based on container height
            const indicator = content.querySelector('span:first-child');
            if (indicator) {
                const indicatorSize = Math.min(16, height * 0.6);
                indicator.style.width = indicatorSize + 'px';
                indicator.style.height = indicatorSize + 'px';
            }
        }
    }
    
    // Handle section types with complex layouts
    if (['navbar', 'header', 'footer', 'sidebar', 'hero-section', 'content-section', 
         'form', 'modal', 'card', 'table', 'gallery', 'testimonial', 'breadcrumb', 
         'pagination', 'tab', 'accordion'].includes(shapeType)) {
        updateSectionLayout(shape, shapeType, width, height);
    }
    
    // For generic shapes with text content, adjust font size
    if (!['image', 'icon'].includes(shapeType)) {
        const textContent = shape.querySelector('div:not(.image-placeholder)');
        if (textContent && !textContent.querySelector('input, textarea') && 
            !['navbar', 'header', 'footer', 'sidebar', 'hero-section', 'content-section', 
              'form', 'modal', 'card', 'table', 'gallery', 'testimonial', 'breadcrumb', 
              'pagination', 'tab', 'accordion'].includes(shapeType)) {
            const minFontSize = 8;
            const maxFontSize = 16;
            const fontSize = Math.max(minFontSize, Math.min(maxFontSize, Math.min(width, height) * 0.15));
            textContent.style.fontSize = fontSize + 'px';
            textContent.style.lineHeight = height + 'px';
        }
    }
}

function updateSectionLayout(shape, shapeType, width, height) {
    const container = shape.querySelector('div');
    if (!container) return;
    
    // Ensure container takes full size
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.boxSizing = 'border-box';
    
    switch(shapeType) {
        case 'navbar':
        case 'footer':
            // Adjust padding and font size for horizontal layouts
            const padding = Math.max(10, Math.min(20, width * 0.02));
            container.style.padding = `0 ${padding}px`;
            const navFontSize = Math.max(10, Math.min(14, height * 0.3));
            container.style.fontSize = navFontSize + 'px';
            break;
            
        case 'header':
        case 'hero-section':
            // Responsive padding and text sizing
            const headerPadding = Math.max(15, Math.min(60, height * 0.2));
            container.style.padding = `${headerPadding}px 20px`;
            const h1 = container.querySelector('h1');
            if (h1) {
                const h1Size = Math.max(18, Math.min(36, Math.min(width * 0.05, height * 0.25)));
                h1.style.fontSize = h1Size + 'px';
            }
            const p = container.querySelector('p');
            if (p) {
                const pSize = Math.max(12, Math.min(18, Math.min(width * 0.025, height * 0.15)));
                p.style.fontSize = pSize + 'px';
            }
            break;
            
        case 'sidebar':
            // Responsive padding for sidebar
            const sidebarPadding = Math.max(10, Math.min(15, width * 0.06));
            container.style.padding = sidebarPadding + 'px';
            const navItems = container.querySelectorAll('div > div');
            navItems.forEach(item => {
                const itemPadding = Math.max(4, Math.min(8, height * 0.02));
                item.style.padding = itemPadding + 'px';
            });
            break;
            
        case 'content-section':
            // Responsive padding and text sizing
            const contentPadding = Math.max(15, Math.min(30, Math.min(width * 0.04, height * 0.15)));
            container.style.padding = contentPadding + 'px';
            const h2 = container.querySelector('h2');
            if (h2) {
                const h2Size = Math.max(16, Math.min(24, Math.min(width * 0.04, height * 0.2)));
                h2.style.fontSize = h2Size + 'px';
            }
            break;
            
        case 'form':
            // Responsive form layout
            const formPadding = Math.max(15, Math.min(30, Math.min(width * 0.06, height * 0.1)));
            container.style.padding = formPadding + 'px';
            const inputs = container.querySelectorAll('input, textarea, button');
            inputs.forEach(input => {
                const inputPadding = Math.max(6, Math.min(12, height * 0.04));
                input.style.padding = inputPadding + 'px';
                input.style.fontSize = Math.max(12, Math.min(14, height * 0.05)) + 'px';
            });
            break;
            
        case 'modal':
            // Ensure modal header and content scale properly
            const modalHeader = container.querySelector('div:first-child');
            const modalContent = container.querySelector('div:last-child');
            if (modalHeader && modalContent) {
                const headerHeight = Math.max(40, Math.min(60, height * 0.15));
                modalHeader.style.minHeight = headerHeight + 'px';
                modalContent.style.height = `calc(100% - ${headerHeight}px)`;
            }
            break;
            
        case 'card':
            // Responsive card padding
            const cardPadding = Math.max(10, Math.min(20, Math.min(width * 0.067, height * 0.1)));
            container.style.padding = cardPadding + 'px';
            const imageDiv = container.querySelector('div:first-child');
            if (imageDiv) {
                const imageHeight = Math.max(40, Math.min(80, height * 0.4));
                imageDiv.style.height = imageHeight + 'px';
            }
            break;
            
        case 'table':
            // Responsive table layout
            const tablePadding = Math.max(10, Math.min(20, Math.min(width * 0.02, height * 0.08)));
            container.style.padding = tablePadding + 'px';
            const table = container.querySelector('table');
            if (table) {
                const cellPadding = Math.max(4, Math.min(8, height * 0.03));
                const cells = table.querySelectorAll('th, td');
                cells.forEach(cell => {
                    cell.style.padding = cellPadding + 'px';
                    cell.style.fontSize = Math.max(10, Math.min(14, height * 0.06)) + 'px';
                });
            }
            break;
            
        case 'gallery':
            // Responsive gallery grid
            const galleryPadding = Math.max(10, Math.min(20, Math.min(width * 0.04, height * 0.1)));
            container.style.padding = galleryPadding + 'px';
            const grid = container.querySelector('div:last-child');
            if (grid) {
                const cols = width < 200 ? 2 : 3;
                grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            }
            break;
            
        case 'testimonial':
            // Responsive testimonial padding
            const testPadding = Math.max(15, Math.min(30, Math.min(width * 0.1, height * 0.15)));
            container.style.padding = testPadding + 'px';
            const quote = container.querySelector('div:first-child');
            if (quote) {
                const quoteSize = Math.max(24, Math.min(36, height * 0.2));
                quote.style.fontSize = quoteSize + 'px';
            }
            break;
            
        case 'breadcrumb':
        case 'pagination':
            // Responsive padding for navigation elements
            const navPadding = Math.max(8, Math.min(15, height * 0.3));
            container.style.padding = `${navPadding}px 20px`;
            container.style.fontSize = Math.max(10, Math.min(14, height * 0.4)) + 'px';
            break;
            
        case 'tab':
            // Responsive tab layout
            const tabHeader = container.querySelector('div:first-child');
            const tabContent = container.querySelector('div:last-child');
            if (tabHeader && tabContent) {
                const headerHeight = Math.max(30, Math.min(50, height * 0.3));
                tabHeader.style.minHeight = headerHeight + 'px';
                tabContent.style.height = `calc(100% - ${headerHeight}px)`;
                const tabs = tabHeader.querySelectorAll('div');
                tabs.forEach(tab => {
                    const tabPadding = Math.max(6, Math.min(12, headerHeight * 0.24));
                    tab.style.padding = `${tabPadding}px 20px`;
                });
            }
            break;
            
        case 'accordion':
            // Responsive accordion sections
            const accSections = container.querySelectorAll('div > div:first-child');
            accSections.forEach(section => {
                const sectionPadding = Math.max(8, Math.min(15, height * 0.05));
                section.style.padding = sectionPadding + 'px';
            });
            break;
    }
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        resizeHandle = null;
        originalBounds = null;
        
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        
        // Emit shape update to other users after resize
        if (selectedShape) {
            import('./collaboration.js').then(collabModule => {
                collabModule.emitShapeUpdated(selectedShape);
            });
        }
    }
}

// Export selected shape for external access
export function getSelectedShape() {
    return selectedShape;
}

export function setSelectedShape(shape) {
    selectedShape = shape;
}

// Clear canvas
export function clearCanvas() {
    document.querySelectorAll('.shape:not(.drawing-shape)').forEach(shape => {
        shape.remove();
    });
    selectedShape = null;
    updatePositionInfo();
    
    // Emit canvas clear to other users
    import('./collaboration.js').then(collabModule => {
        collabModule.emitCanvasClear();
    });
}