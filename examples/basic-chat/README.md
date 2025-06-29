# Basic Chat Example

This example demonstrates a simple real-time chat application built with the MUP SDK. It showcases the core features of the Model UI Protocol including:

- Real-time WebSocket communication
- Dynamic UI generation and updates
- Event handling and form submission
- Component state management
- Auto-reconnection

## Features

- 💬 Real-time messaging
- 👥 Multiple users support
- 🔄 Auto-reconnection
- 📱 Responsive design
- ⚡ Live UI updates
- 🎨 Clean, modern interface

## Architecture

### Server (`server.ts`)
- Creates a MUP server on port 3000
- Manages chat messages in memory
- Handles form submissions and broadcasts updates
- Generates dynamic UI components

### Client (`index.html` + `client.js`)
- Connects to the MUP server via WebSocket
- Renders components received from server
- Handles user interactions and form submissions
- Shows connection status and handles reconnection

## Running the Example

### Prerequisites

1. Make sure you have built the MUP SDK packages:
   ```bash
   cd ../../  # Go to project root
   npm run build
   ```

2. Install example dependencies:
   ```bash
   npm install
   ```

### Option 1: Run Both Server and Client

```bash
npm run dev
```

This will start:
- Server on `ws://localhost:3000/mup`
- Client web server on `http://localhost:3001`

### Option 2: Run Separately

**Terminal 1 - Start the server:**
```bash
npm run server
```

**Terminal 2 - Start the client:**
```bash
npm run client
```

### Usage

1. Open your browser to `http://localhost:3001`
2. Enter your name in the "Your name" field
3. Type a message and click "Send" or press Enter
4. Open multiple browser tabs to test multi-user chat
5. Messages will appear in real-time for all connected users

## Code Walkthrough

### Server Implementation

The server creates a complete chat UI using MUP components:

```typescript
// Create chat UI with messages and input form
function createChatUI(): MUPComponent {
  return {
    id: 'chat-app',
    type: 'container',
    children: [
      // Header
      { id: 'chat-header', type: 'text', props: { content: '💬 MUP Chat Demo' } },
      
      // Messages container
      { id: 'messages-container', type: 'container', children: messages.map(...) },
      
      // Input form
      {
        id: 'input-form',
        type: 'form',
        events: { on_submit: true },
        children: [
          { id: 'username-input', type: 'input' },
          { id: 'message-input', type: 'input' },
          { id: 'send-button', type: 'button' }
        ]
      }
    ]
  };
}
```

### Event Handling

When a user submits the form:

```typescript
server.on('client_event', (session, event) => {
  if (event.component_id === 'input-form' && event.event_type === 'submit') {
    const formData = event.event_data;
    const username = formData['username-input'];
    const messageText = formData['message-input'];
    
    // Add message and broadcast updated UI
    messages.push({ id, user: username, text: messageText, timestamp: new Date() });
    server.broadcastComponentUpdate(createChatUI());
  }
});
```

### Client Rendering

The client automatically renders components:

```javascript
client.on('component_update', (component) => {
  // Clear app and render the new component tree
  app.innerHTML = '';
  client.renderComponent(component, app);
});
```

## Key MUP Concepts Demonstrated

### 1. Component Tree
The entire chat interface is defined as a tree of MUP components, from containers to individual text and input elements.

### 2. Event-Driven Updates
User interactions trigger events that are sent to the server, which responds with updated UI components.

### 3. Real-Time Synchronization
All connected clients receive the same component updates, keeping the UI synchronized across users.

### 4. Declarative UI
The server describes what the UI should look like, and the client renders it accordingly.

## Customization Ideas

### Add Features
- User avatars and profiles
- Message timestamps
- Typing indicators
- Message reactions
- Private messaging
- Chat rooms/channels

### Enhance UI
- Dark mode toggle
- Custom themes
- Emoji picker
- File uploads
- Message formatting (bold, italic)

### Improve Functionality
- Message persistence (database)
- User authentication
- Message history
- Push notifications
- Mobile app version

## Troubleshooting

### Server Won't Start
- Check if port 3000 is available
- Ensure MUP SDK packages are built
- Verify Node.js version (16+ required)

### Client Can't Connect
- Ensure server is running
- Check browser console for errors
- Verify WebSocket URL is correct
- Check firewall settings

### Messages Not Appearing
- Check server console for errors
- Verify form data is being sent
- Check network tab in browser dev tools

## Next Steps

1. **Explore the Code**: Read through the server and client code to understand the MUP protocol
2. **Modify the UI**: Try changing component properties and styles
3. **Add Features**: Implement new functionality like user lists or message history
4. **Build Your Own**: Use this as a starting point for your own MUP application

## Related Examples

- **Form Builder**: Dynamic form generation
- **Dashboard**: Real-time data visualization
- **Game UI**: Interactive game interface

For more examples and documentation, visit the [MUP SDK repository](../../README.md).