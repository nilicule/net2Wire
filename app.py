from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv
import os
import uuid
import time
import random

# Generate UUID7-like identifiers (time-ordered)
def generate_room_id():
    """Generate a UUID7-like time-ordered identifier.
    
    UUID7 format: 48-bit timestamp + 12-bit random + 2-bit version + 62-bit random
    Since UUID7 isn't widely available yet, we'll create a time-ordered UUID
    using timestamp + UUID4 for similar benefits.
    """
    import struct
    import secrets
    
    # Get current time in milliseconds since epoch
    timestamp_ms = int(time.time() * 1000)
    
    # Create a UUID7-like structure
    # 48 bits timestamp (6 bytes) + 80 bits random (10 bytes)
    timestamp_bytes = struct.pack('>Q', timestamp_ms)[-6:]  # Take last 6 bytes (48 bits)
    random_bytes = secrets.token_bytes(10)  # 80 bits of randomness
    
    # Combine and format as UUID
    uuid_bytes = timestamp_bytes + random_bytes
    
    # Format as standard UUID string with version 7 marker
    uuid_int = int.from_bytes(uuid_bytes, 'big')
    uuid_hex = f'{uuid_int:032x}'
    
    # Insert hyphens in UUID format and set version to 7
    uuid_str = f'{uuid_hex[:8]}-{uuid_hex[8:12]}-7{uuid_hex[13:16]}-{uuid_hex[16:20]}-{uuid_hex[20:32]}'
    
    return uuid_str

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Get base path from environment
BASE_PATH = os.getenv('BASE_PATH', '').rstrip('/')

# Store active users and their data
active_users = {}
rooms = {}

def generate_user_id():
    """Generate anonymous user ID like 'Anonymous #123'"""
    user_number = random.randint(100, 999)
    return f"Anonymous #{user_number}"

def generate_user_color():
    """Generate a random color for user cursor/selection"""
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
    return random.choice(colors)

@app.route(f'{BASE_PATH}/')
def index():
    # Generate a new room ID and redirect to it
    room_id = generate_room_id()
    return redirect(url_for('room', room_id=room_id))

@app.route(f'{BASE_PATH}/room/<room_id>')
def room(room_id):
    # Check if this room exists or is new
    is_new = room_id not in rooms
    return render_template('index.html', room_id=room_id, is_new_room=is_new, base_path=BASE_PATH)

@socketio.on('connect')
def on_connect():
    print(f'User connected: {request.sid}')
    
    # Generate user info
    user_id = generate_user_id()
    user_color = generate_user_color()
    
    # Store user info
    active_users[request.sid] = {
        'id': user_id,
        'color': user_color,
        'mouse_x': 0,
        'mouse_y': 0,
        'connected_at': time.time(),
        'room_id': None  # Will be set when joining room
    }

@socketio.on('join_room')
def on_join_room(data):
    room_id = data.get('room_id', 'default')
    print(f'User {request.sid} joining room: {room_id}')
    
    if request.sid not in active_users:
        print(f'User {request.sid} not found in active_users')
        return
    
    user_data = active_users[request.sid]
    user_data['room_id'] = room_id
    
    join_room(room_id)
    
    if room_id not in rooms:
        rooms[room_id] = {
            'shapes': [],
            'users': []
        }
    
    if request.sid not in rooms[room_id]['users']:
        rooms[room_id]['users'].append(request.sid)
    
    # Send user their own info
    emit('user_info', {
        'user_id': user_data['id'],
        'color': user_data['color'],
        'session_id': request.sid
    })
    
    # Notify other users about new user
    emit('user_joined', {
        'user_id': user_data['id'],
        'color': user_data['color'], 
        'session_id': request.sid
    }, room=room_id, include_self=False)
    
    # Send current room state to new user
    if rooms[room_id]['shapes']:
        emit('load_shapes', {'shapes': rooms[room_id]['shapes']})
    
    # Send current users to new user
    current_users = []
    for user_sid in rooms[room_id]['users']:
        if user_sid != request.sid and user_sid in active_users:
            other_user_data = active_users[user_sid]
            current_users.append({
                'session_id': user_sid,
                'user_id': other_user_data['id'],
                'color': other_user_data['color'],
                'mouse_x': other_user_data['mouse_x'],
                'mouse_y': other_user_data['mouse_y']
            })
    
    if current_users:
        emit('current_users', {'users': current_users})

@socketio.on('disconnect')
def on_disconnect():
    print(f'User disconnected: {request.sid}')
    
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        # Remove from room if they were in one
        if room_id and room_id in rooms:
            if request.sid in rooms[room_id]['users']:
                rooms[room_id]['users'].remove(request.sid)
                
                # Notify other users in the same room
                emit('user_left', {
                    'session_id': request.sid,
                    'user_id': user_data['id']
                }, room=room_id)
        
        # Remove user data
        del active_users[request.sid]

@socketio.on('mouse_move')
def on_mouse_move(data):
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        # Update user's mouse position
        user_data['mouse_x'] = data['x']
        user_data['mouse_y'] = data['y']
        
        # Broadcast to other users in the same room
        if room_id:
            emit('user_mouse_move', {
                'session_id': request.sid,
                'x': data['x'],
                'y': data['y']
            }, room=room_id, include_self=False)

@socketio.on('shape_created')
def on_shape_created(data):
    print(f'Received shape_created from {request.sid}: {data}')
    
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        print(f'User {request.sid} in room {room_id}')
        
        if room_id and room_id in rooms:
            # Add shape to room
            shape_data = {
                'id': data.get('id'),
                'type': data.get('type'),
                'x': data.get('x'),
                'y': data.get('y'),
                'width': data.get('width'),
                'height': data.get('height'),
                'content': data.get('content'),
                'created_by': request.sid,
                'created_at': time.time()
            }
            
            rooms[room_id]['shapes'].append(shape_data)
            print(f'Added shape to room {room_id}. Room now has {len(rooms[room_id]["shapes"])} shapes')
            print(f'Broadcasting to {len(rooms[room_id]["users"])} users in room')
            
            # Broadcast to other users
            emit('shape_created', shape_data, room=room_id, include_self=False)
            print(f'Broadcasted shape_created: {shape_data}')
        else:
            print(f'Room {room_id} not found or user not in active users')
    else:
        print(f'User {request.sid} not in active_users')

@socketio.on('shape_updated')
def on_shape_updated(data):
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        if room_id and room_id in rooms:
            # Find and update shape
            for i, shape in enumerate(rooms[room_id]['shapes']):
                if shape['id'] == data.get('id'):
                    # Update shape properties
                    shape.update({
                        'x': data.get('x', shape['x']),
                        'y': data.get('y', shape['y']),
                        'width': data.get('width', shape['width']),
                        'height': data.get('height', shape['height']),
                        'type': data.get('type', shape['type']),
                        'content': data.get('content', shape.get('content')),
                        'updated_by': request.sid,
                        'updated_at': time.time()
                    })
                    
                    # Broadcast to other users
                    emit('shape_updated', shape, room=room_id, include_self=False)
                    break

@socketio.on('shape_deleted')
def on_shape_deleted(data):
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        if room_id and room_id in rooms:
            # Remove shape
            rooms[room_id]['shapes'] = [
                shape for shape in rooms[room_id]['shapes'] 
                if shape['id'] != data.get('id')
            ]
            
            # Broadcast to other users
            emit('shape_deleted', {
                'id': data.get('id'),
                'deleted_by': request.sid
            }, room=room_id, include_self=False)

@socketio.on('canvas_cleared')
def on_canvas_cleared(data):
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        if room_id and room_id in rooms:
            # Clear all shapes from room
            rooms[room_id]['shapes'] = []
            
            # Broadcast to other users
            emit('canvas_cleared', {
                'cleared_by': request.sid
            }, room=room_id, include_self=False)

@socketio.on('chat_message')
def on_chat_message(data):
    if request.sid in active_users:
        user_data = active_users[request.sid]
        room_id = user_data.get('room_id')
        
        if room_id and room_id in rooms:
            # Get message content and sanitize (basic XSS prevention)
            message = data.get('message', '').strip()
            
            # Validate message length and content
            if not message or len(message) > 500:
                return
            
            # Basic sanitization - remove HTML tags and escape special characters
            import html
            message = html.escape(message)
            
            # Create message data (no persistence - only in memory during broadcast)
            message_data = {
                'user_id': user_data['id'],
                'user_color': user_data['color'],
                'message': message,
                'timestamp': time.time()
            }
            
            # Broadcast to all users in the room (including sender for confirmation)
            emit('chat_message', message_data, room=room_id)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))  # Default to 5000 if PORT not set
    socketio.run(app, debug=True, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)