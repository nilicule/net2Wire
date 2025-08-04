// shapes.js - Shape creation, manipulation, and configuration

let shapeCounter = 0;

// Define comprehensive list of page elements organized by category
export const pageElements = {
    elements: [
        { type: 'rectangle', name: 'Box', icon: '⬛' },
        { type: 'block-text', name: 'Text', icon: '📝' },
        { type: 'image', name: 'Image', icon: '🖼️' },
        { type: 'icon', name: 'Icon', icon: '⭐' },
        { type: 'button', name: 'Button', icon: '🔘' },
        { type: 'text-input', name: 'Text Input', icon: '📝' },
        { type: 'block-text', name: 'Block Text', icon: '📄' },
        { type: 'block-list', name: 'Block List', icon: '📋' },
        { type: 'block-headline', name: 'Block Headline', icon: '📰' },
        { type: 'dropdown', name: 'Dropdown', icon: '📋' },
        { type: 'line-horizontal', name: 'Line (Horizontal)', icon: '➖' },
        { type: 'line-vertical', name: 'Line (Vertical)', icon: '|' },
        { type: 'checkbox', name: 'Checkbox', icon: '☑️' },
        { type: 'radio', name: 'Radio Button', icon: '🔘' },
        { type: 'slider', name: 'Slider', icon: '🎚️' },
        { type: 'progress', name: 'Progress Bar', icon: '📊' },
        { type: 'scrollbar-horizontal', name: 'Scrollbar (Horizontal)', icon: '↔️' },
        { type: 'scrollbar-vertical', name: 'Scrollbar (Vertical)', icon: '↕️' }
    ],
    sections: [
        { type: 'navbar', name: 'Navbar', icon: '🧭' },
        { type: 'header', name: 'Header', icon: '🎯' },
        { type: 'footer', name: 'Footer', icon: '⬇️' },
        { type: 'sidebar', name: 'Sidebar', icon: '📑' },
        { type: 'form', name: 'Form', icon: '📝' },
        { type: 'card', name: 'Card', icon: '🃏' },
        { type: 'modal', name: 'Modal', icon: '🖼️' },
        { type: 'table', name: 'Table', icon: '📊' },
        { type: 'tab', name: 'Tab', icon: '📂' },
        { type: 'accordion', name: 'Accordion', icon: '📁' },
        { type: 'breadcrumb', name: 'Breadcrumb', icon: '🍞' },
        { type: 'pagination', name: 'Pagination', icon: '📄' },
        { type: 'hero-section', name: 'Hero Section', icon: '🎭' },
        { type: 'content-section', name: 'Content Section', icon: '📰' },
        { type: 'gallery', name: 'Gallery', icon: '🖼️' },
        { type: 'testimonial', name: 'Testimonial', icon: '💬' }
    ]
};

// Smart section positioning and sizing
export function getSectionDefaults(type) {
    const canvasWidth = 1024;
    const canvas = document.getElementById('canvas');
    const canvasHeight = canvas.offsetHeight || 600;
    
    const sectionTypes = {
        'navbar': {
            x: 0,
            y: 0,
            width: canvasWidth,
            height: 60
        },
        'header': {
            x: 0,
            y: 60,
            width: canvasWidth,
            height: 120
        },
        'footer': {
            x: 0,
            y: Math.max(400, canvasHeight - 80),
            width: canvasWidth,
            height: 80
        },
        'sidebar': {
            x: 0,
            y: 180,
            width: 250,
            height: Math.max(300, canvasHeight - 260)
        },
        'hero-section': {
            x: 0,
            y: 60,
            width: canvasWidth,
            height: 300
        },
        'content-section': {
            x: 250,
            y: 180,
            width: canvasWidth - 250,
            height: 200
        },
        'form': {
            x: Math.floor(canvasWidth * 0.25),
            y: 200,
            width: Math.floor(canvasWidth * 0.5),
            height: 300
        },
        'modal': {
            x: Math.floor(canvasWidth * 0.2),
            y: 150,
            width: Math.floor(canvasWidth * 0.6),
            height: 400
        },
        'card': {
            x: 50,
            y: 200,
            width: 300,
            height: 200
        },
        'table': {
            x: 50,
            y: 200,
            width: canvasWidth - 100,
            height: 250
        }
    };
    
    return sectionTypes[type] || null;
}

// Create shape with specific type and dimensions
export function createShape(type, x, y, width, height) {
    console.log(`Creating shape #${shapeCounter + 1} at:`, x, y, 'size:', width, height);
    
    // Remove any drawing shapes first
    const drawingShapes = document.querySelectorAll('.drawing-shape');
    console.log('Removing drawing shapes:', drawingShapes.length);
    drawingShapes.forEach(shape => shape.remove());

    const shape = document.createElement('div');
    shape.className = 'shape';
    shape.id = `shape-${shapeCounter++}`;
    shape.setAttribute('data-type', type);
    
    // Check if this is a section type and apply smart positioning/sizing
    const sectionDefaults = getSectionDefaults(type);
    if (sectionDefaults) {
        x = sectionDefaults.x;
        y = sectionDefaults.y;
        width = sectionDefaults.width;
        height = sectionDefaults.height;
    }
    
    // Force absolute positioning and set position/size
    shape.style.position = 'absolute';
    shape.style.left = x + 'px';
    shape.style.top = y + 'px';
    shape.style.width = width + 'px';
    shape.style.height = height + 'px';
    
    console.log('Shape element created with styles:', {
        left: shape.style.left,
        top: shape.style.top,
        width: shape.style.width,
        height: shape.style.height
    });
    
    // Apply shape content based on type
    applyShapeContent(shape, type, width, height);
    
    // Add event listeners
    addShapeEventListeners(shape, type);
    
    const canvas = document.getElementById('canvas');
    canvas.appendChild(shape);
    
    // Import necessary functions dynamically
    import('./canvas.js').then(canvasModule => {
        canvasModule.selectShape({ target: shape });
    });
    
    // Emit shape creation to other users (with small delay to ensure DOM is ready)
    setTimeout(() => {
        import('./collaboration.js').then(collabModule => {
            collabModule.emitShapeCreated(shape);
        });
    }, 50);
    
    return shape;
}

// Apply content to shape based on type
function applyShapeContent(shape, type, width, height) {
    switch(type) {
        case 'image':
            shape.classList.add('image-shape');
            shape.innerHTML = `
                <div class="image-placeholder">
                    <div class="image-icon">🖼️</div>
                    <div style="font-size: 10px;">Image</div>
                </div>
            `;
            break;
        case 'icon':
            shape.classList.add('box-shape');
            shape.classList.add('icon-shape');
            shape.innerHTML = '⭐';
            break;
        case 'button':
            shape.classList.add('box-shape');
            shape.style.background = '#007bff';
            shape.style.color = 'white';
            shape.style.border = 'none';
            shape.innerHTML = '<div style="text-align: center; line-height: ' + height + 'px; font-size: 14px;">Button</div>';
            break;
        case 'text-input':
            shape.classList.add('text-shape');
            shape.style.border = '2px solid #ddd';
            shape.style.borderRadius = '4px';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.style.border = 'none';
            input.style.background = 'transparent';
            input.style.width = '100%';
            input.style.height = '100%';
            input.style.padding = '8px';
            input.placeholder = 'Enter text...';
            input.addEventListener('input', function() {
                // Emit content updates when text changes
                setTimeout(() => {
                    import('./collaboration.js').then(collabModule => {
                        collabModule.emitShapeUpdated(shape);
                    });
                }, 300);
            });
            shape.appendChild(input);
            break;
        case 'block-text':
            shape.classList.add('text-shape');
            const textarea = document.createElement('textarea');
            textarea.className = 'text-input';
            textarea.value = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...';
            textarea.style.fontSize = '14px';
            textarea.style.lineHeight = '1.5';
            textarea.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    this.value = 'Lorem ipsum dolor sit amet...';
                }
            });
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, parseInt(shape.style.height) - 16) + 'px';
                // Emit content updates when text changes
                setTimeout(() => {
                    import('./collaboration.js').then(collabModule => {
                        collabModule.emitShapeUpdated(shape);
                    });
                }, 300);
            });
            shape.appendChild(textarea);
            break;
        case 'block-headline':
            shape.classList.add('text-shape');
            shape.innerHTML = '<div style="font-size: 24px; font-weight: bold; line-height: ' + height + 'px; text-align: center;">Headline</div>';
            break;
        case 'dropdown':
            shape.classList.add('box-shape');
            shape.style.border = '2px solid #ddd';
            shape.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px;"><span>Select option</span><span>▼</span></div>';
            break;
        case 'checkbox':
            shape.classList.add('box-shape');
            shape.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; padding: 8px;"><span style="width: 16px; height: 16px; border: 2px solid #999; display: inline-block;"></span><span>Checkbox</span></div>';
            break;
        case 'radio':
            shape.classList.add('box-shape');
            shape.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; padding: 8px;"><span style="width: 16px; height: 16px; border: 2px solid #999; border-radius: 50%; display: inline-block;"></span><span>Radio Button</span></div>';
            break;
        // Section types with realistic content
        case 'navbar':
            shape.classList.add('box-shape');
            shape.style.background = '#2c3e50';
            shape.style.color = 'white';
            shape.style.border = 'none';
            shape.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; padding: 0 20px; height: 100%;"><div style="font-weight: bold;">Brand</div><div style="display: flex; gap: 20px;"><span>Home</span><span>About</span><span>Contact</span></div></div>';
            break;
        case 'header':
            shape.classList.add('box-shape');
            shape.style.background = '#34495e';
            shape.style.color = 'white';
            shape.style.textAlign = 'center';
            shape.innerHTML = '<div style="padding: 20px;"><h1 style="margin: 0; font-size: 28px;">Page Title</h1><p style="margin: 10px 0 0 0; opacity: 0.8;">Subtitle or description</p></div>';
            break;
        case 'footer':
            shape.classList.add('box-shape');
            shape.style.background = '#2c3e50';
            shape.style.color = 'white';
            shape.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; padding: 0 20px; height: 100%; font-size: 12px;"><div>© 2024 Company Name</div><div style="display: flex; gap: 15px;"><span>Privacy</span><span>Terms</span><span>Contact</span></div></div>';
            break;
        case 'sidebar':
            shape.classList.add('box-shape');
            shape.style.background = '#ecf0f1';
            shape.style.border = '1px solid #bdc3c7';
            shape.innerHTML = '<div style="padding: 15px;"><h3 style="margin: 0 0 15px 0; font-size: 16px;">Navigation</h3><div style="display: flex; flex-direction: column; gap: 8px;"><div style="padding: 8px; background: #3498db; color: white; border-radius: 3px;">Dashboard</div><div style="padding: 8px; color: #666;">Users</div><div style="padding: 8px; color: #666;">Settings</div><div style="padding: 8px; color: #666;">Reports</div></div></div>';
            break;
        case 'hero-section':
            shape.classList.add('box-shape');
            shape.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            shape.style.color = 'white';
            shape.style.textAlign = 'center';
            shape.innerHTML = '<div style="padding: 60px 20px;"><h1 style="margin: 0 0 20px 0; font-size: 36px;">Welcome to Our Product</h1><p style="margin: 0 0 30px 0; font-size: 18px; opacity: 0.9;">Build amazing experiences with our platform</p><button style="background: #fff; color: #667eea; border: none; padding: 12px 30px; border-radius: 25px; font-size: 16px; cursor: pointer;">Get Started</button></div>';
            break;
        case 'content-section':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #e1e8ed';
            shape.innerHTML = '<div style="padding: 30px;"><h2 style="margin: 0 0 15px 0; font-size: 24px; color: #2c3e50;">Content Section</h2><p style="margin: 0; color: #666; line-height: 1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p></div>';
            break;
        case 'form':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #ddd';
            shape.innerHTML = '<div style="padding: 30px;"><h2 style="margin: 0 0 20px 0; text-align: center;">Contact Form</h2><div style="display: flex; flex-direction: column; gap: 15px;"><input style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Name"><input style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Email"><textarea style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 80px; resize: none;" placeholder="Message"></textarea><button style="background: #3498db; color: white; border: none; padding: 12px; border-radius: 4px; cursor: pointer;">Send Message</button></div></div>';
            break;
        case 'modal':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #ddd';
            shape.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            shape.innerHTML = '<div><div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;"><h3 style="margin: 0;">Modal Title</h3><span style="cursor: pointer; color: #999;">✕</span></div><div style="padding: 30px;"><p style="margin: 0 0 20px 0;">This is a modal dialog. You can put any content here.</p><div style="display: flex; gap: 10px; justify-content: flex-end;"><button style="background: #ecf0f1; border: 1px solid #bdc3c7; padding: 8px 16px; border-radius: 4px;">Cancel</button><button style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px;">Confirm</button></div></div></div>';
            break;
        case 'card':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #e1e8ed';
            shape.style.borderRadius = '8px';
            shape.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            shape.innerHTML = '<div style="padding: 20px;"><div style="width: 100%; height: 80px; background: #ecf0f1; border-radius: 4px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; color: #666;">Image</div><h3 style="margin: 0 0 10px 0; font-size: 18px;">Card Title</h3><p style="margin: 0; color: #666; font-size: 14px;">Card description text goes here.</p></div>';
            break;
        case 'table':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #ddd';
            shape.innerHTML = '<div style="padding: 20px;"><h3 style="margin: 0 0 15px 0;">Data Table</h3><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8f9fa;"><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Name</th><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Date</th></tr></thead><tbody><tr><td style="padding: 8px; border: 1px solid #ddd;">John Doe</td><td style="padding: 8px; border: 1px solid #ddd;">Active</td><td style="padding: 8px; border: 1px solid #ddd;">2024-01-15</td></tr><tr><td style="padding: 8px; border: 1px solid #ddd;">Jane Smith</td><td style="padding: 8px; border: 1px solid #ddd;">Pending</td><td style="padding: 8px; border: 1px solid #ddd;">2024-01-16</td></tr></tbody></table></div>';
            break;
        case 'gallery':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #e1e8ed';
            shape.innerHTML = '<div style="padding: 20px;"><h3 style="margin: 0 0 15px 0;">Image Gallery</h3><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"><div style="aspect-ratio: 1; background: #ecf0f1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">🖼️</div><div style="aspect-ratio: 1; background: #ecf0f1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">🖼️</div><div style="aspect-ratio: 1; background: #ecf0f1; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">🖼️</div></div></div>';
            break;
        case 'testimonial':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #e1e8ed';
            shape.style.borderRadius = '8px';
            shape.innerHTML = '<div style="padding: 30px; text-align: center;"><div style="font-size: 36px; color: #3498db; margin-bottom: 15px;">"</div><p style="margin: 0 0 20px 0; font-style: italic; color: #666;">"This product has transformed our business. Highly recommend!"</p><div><strong>Sarah Johnson</strong><div style="color: #999; font-size: 14px;">CEO, TechCorp</div></div></div>';
            break;
        case 'breadcrumb':
            shape.classList.add('box-shape');
            shape.style.background = '#f8f9fa';
            shape.style.border = '1px solid #e9ecef';
            shape.innerHTML = '<div style="padding: 10px 20px; display: flex; align-items: center; gap: 5px; font-size: 14px; color: #666;"><span>Home</span><span>></span><span>Category</span><span>></span><span style="color: #333; font-weight: 500;">Current Page</span></div>';
            break;
        case 'pagination':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #e1e8ed';
            shape.innerHTML = '<div style="padding: 15px; display: flex; justify-content: center; gap: 5px;"><button style="padding: 8px 12px; border: 1px solid #ddd; background: #f8f9fa; cursor: pointer;">« Prev</button><button style="padding: 8px 12px; border: 1px solid #3498db; background: #3498db; color: white;">1</button><button style="padding: 8px 12px; border: 1px solid #ddd; background: white;">2</button><button style="padding: 8px 12px; border: 1px solid #ddd; background: white;">3</button><button style="padding: 8px 12px; border: 1px solid #ddd; background: #f8f9fa; cursor: pointer;">Next »</button></div>';
            break;
        case 'tab':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #ddd';
            shape.innerHTML = '<div><div style="display: flex; border-bottom: 1px solid #ddd;"><div style="padding: 12px 20px; background: #3498db; color: white; border-bottom: 2px solid #3498db;">Tab 1</div><div style="padding: 12px 20px; color: #666; cursor: pointer;">Tab 2</div><div style="padding: 12px 20px; color: #666; cursor: pointer;">Tab 3</div></div><div style="padding: 20px;"><p style="margin: 0;">Content for the active tab goes here.</p></div></div>';
            break;
        case 'accordion':
            shape.classList.add('box-shape');
            shape.style.background = '#fff';
            shape.style.border = '1px solid #ddd';
            shape.innerHTML = '<div><div style="border-bottom: 1px solid #eee;"><div style="padding: 15px; background: #f8f9fa; display: flex; justify-content: space-between; cursor: pointer;"><span>Section 1</span><span>▼</span></div><div style="padding: 15px;">Content for section 1 goes here.</div></div><div style="border-bottom: 1px solid #eee;"><div style="padding: 15px; background: #f8f9fa; display: flex; justify-content: space-between; cursor: pointer;"><span>Section 2</span><span>▶</span></div></div><div><div style="padding: 15px; background: #f8f9fa; display: flex; justify-content: space-between; cursor: pointer;"><span>Section 3</span><span>▶</span></div></div></div>';
            break;
        default:
            // For all other types, show a generic box with the type name
            shape.classList.add('box-shape');
            const allElements = [...pageElements.elements, ...pageElements.sections];
            const displayName = allElements.find(el => el.type === type)?.name || type;
            shape.innerHTML = '<div style="text-align: center; line-height: ' + height + 'px; color: #999; font-size: 12px;">' + displayName + '</div>';
            break;
    }
}

// Add event listeners to shape
function addShapeEventListeners(shape, type) {
    shape.addEventListener('mousedown', function(event) {
        import('./canvas.js').then(canvasModule => {
            canvasModule.startShapeDrag(event);
        });
    });
    
    shape.addEventListener('click', function(event) {
        import('./canvas.js').then(canvasModule => {
            canvasModule.selectShape(event);
        });
    });
    
    shape.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        handleShapeDoubleClick(shape, e);
    });
    
    // For text shapes, add special handling to enable dragging
    if (type === 'text-input' || type === 'block-text') {
        const textElement = shape.querySelector('.text-input, input, textarea');
        if (textElement) {
            textElement.addEventListener('mousedown', function(e) {
                // If not focused, allow dragging by preventing default and calling shape drag
                if (document.activeElement !== textElement) {
                    e.preventDefault();
                    import('./canvas.js').then(canvasModule => {
                        canvasModule.startShapeDrag(e);
                    });
                }
            });
        }
    }
    
    // Special handling for text shapes
    if (type === 'text-input' || type === 'block-text') {
        // For text inputs, double-click focuses the input instead of changing type
        shape.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            const textInput = shape.querySelector('.text-input, input, textarea');
            if (textInput) {
                textInput.focus();
                if (textInput.select) textInput.select();
            } else {
                handleShapeDoubleClick(shape, e);
            }
        });
    }
}

// Handle shape double-click for type changing
export function handleShapeDoubleClick(shape, event) {
    // Get shape position and dimensions
    const rect = shape.getBoundingClientRect();
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const x = rect.left - canvasRect.left;
    const y = rect.top - canvasRect.top;
    const width = rect.width;
    const height = rect.height;
    
    // Show type selector for changing the shape type
    showShapeTypeChangeSelector(shape, x, y, width, height);
}

// Show shape type change selector
function showShapeTypeChangeSelector(shape, x, y, width, height) {
    // Create simple type selector popup (same as creation, but for changing)
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
            <button class="type-option hamburger-option" onclick="showFullElementChangePicker('${shape.id}', ${x}, ${y}, ${width}, ${height}); this.closest('.type-selector-popup').remove();">
                <span>☰</span>
            </button>
        </div>
    `;
    
    const canvas = document.getElementById('canvas');
    
    // Position the selector above the shape
    selector.style.left = (x + width/2) + 'px';
    selector.style.top = (y - 50) + 'px';
    selector.style.transform = 'translateX(-50%)';
    
    // Make sure it doesn't go off screen
    canvas.appendChild(selector);
    
    // Adjust position if it goes off edges
    const selectorRect = selector.getBoundingClientRect();
    const canvasLeft = canvas.getBoundingClientRect().left;
    const canvasRight = canvas.getBoundingClientRect().right;
    
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
            const newType = this.dataset.type;
            selector.remove();
            changeShapeType(shape, newType);
        });
    });
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeSelector(e) {
            if (!selector.contains(e.target)) {
                selector.remove();
                document.removeEventListener('click', closeSelector);
            }
        });
    }, 100);
}

// Change shape type
export function changeShapeType(shape, newType) {
    // Store current dimensions
    const currentWidth = shape.offsetWidth;
    const currentHeight = shape.offsetHeight;
    const currentX = parseInt(shape.style.left) || 0;
    const currentY = parseInt(shape.style.top) || 0;
    
    // Update the shape's data-type attribute
    shape.setAttribute('data-type', newType);
    
    // Clear existing content and classes
    shape.innerHTML = '';
    shape.className = 'shape';
    shape.style.position = 'absolute';
    shape.style.left = currentX + 'px';
    shape.style.top = currentY + 'px';
    shape.style.width = currentWidth + 'px';
    shape.style.height = currentHeight + 'px';
    
    // Apply new type styling
    applyShapeContent(shape, newType, currentWidth, currentHeight);
    
    // Re-add event listeners
    addShapeEventListeners(shape, newType);
    
    // Emit shape type change to other users
    import('./collaboration.js').then(collabModule => {
        collabModule.emitShapeUpdated(shape);
    });
}

// Create shape from saved data
export function createShapeFromData(shapeData) {
    const shape = document.createElement('div');
    shape.className = 'shape';
    shape.id = shapeData.id || `shape-${shapeCounter++}`;
    shape.setAttribute('data-type', shapeData.type);
    
    // Force absolute positioning and set position/size
    shape.style.position = 'absolute';
    shape.style.left = shapeData.x + 'px';
    shape.style.top = shapeData.y + 'px';
    shape.style.width = shapeData.width + 'px';
    shape.style.height = shapeData.height + 'px';
    
    // Apply shape content
    applyShapeContent(shape, shapeData.type, shapeData.width, shapeData.height);
    
    // Restore text content for text shapes
    if (shapeData.text && shapeData.type === 'block-text') {
        const textarea = shape.querySelector('textarea');
        if (textarea) {
            textarea.value = shapeData.text;
        }
    }
    
    // Add event listeners
    addShapeEventListeners(shape, shapeData.type);
    
    const canvas = document.getElementById('canvas');
    canvas.appendChild(shape);
    
    return shape;
}

// Make functions available globally for HTML onclick handlers
window.showFullElementChangePicker = function(shapeId, x, y, width, height) {
    const shape = document.getElementById(shapeId);
    if (!shape) return;
    
    import('./ui.js').then(uiModule => {
        uiModule.showFullElementPicker(shape, x, y, width, height);
    });
};

// Export shape counter for external access
export function getShapeCounter() {
    return shapeCounter;
}

export function setShapeCounter(value) {
    shapeCounter = value;
}