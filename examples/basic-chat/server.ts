import { MUPServer } from '@muprotocol/server';
import { Component } from '@muprotocol/types';

// Create server instance
const server = new MUPServer({
  port: 3000,
  path: '/mup'
});

// Store chat messages
const messages: Array<{ id: string; user: string; text: string; timestamp: Date }> = [];
let messageCounter = 0;

// Helper function to create chat UI
function createChatUI(): Component {
  return {
    id: 'chat-app',
    type: 'container',
    props: {
      layout: 'flex',
      direction: 'column',
      padding: 20,
      gap: 16,
      style: {
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }
    },
    children: [
      {
        id: 'chat-header',
        type: 'text',
        props: {
          content: '💬 MUP Chat Demo',
          variant: 'h1',
          align: 'center',
          style: {
            color: '#333',
            marginBottom: '20px'
          }
        }
      },
      {
        id: 'messages-container',
        type: 'container',
        props: {
          layout: 'flex',
          direction: 'column',
          gap: 8,
          style: {
            flex: '1',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#f9f9f9'
          }
        },
        children: messages.map(msg => ({
          id: `message-${msg.id}`,
          type: 'container',
          props: {
            layout: 'flex',
            direction: 'column',
            gap: 4,
            style: {
              padding: '8px 12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #eee'
            }
          },
          children: [
            {
              id: `message-header-${msg.id}`,
              type: 'container',
              props: {
                layout: 'flex',
                direction: 'row',
                justify: 'space-between',
                align: 'center'
              },
              children: [
                {
                  id: `message-user-${msg.id}`,
                  type: 'text',
                  props: {
                    content: msg.user,
                    style: {
                      fontWeight: 'bold',
                      color: '#007bff'
                    }
                  }
                },
                {
                  id: `message-time-${msg.id}`,
                  type: 'text',
                  props: {
                    content: msg.timestamp.toLocaleTimeString(),
                    style: {
                      fontSize: '12px',
                      color: '#666'
                    }
                  }
                }
              ]
            },
            {
              id: `message-text-${msg.id}`,
              type: 'text',
              props: {
                content: msg.text,
                style: {
                  color: '#333',
                  lineHeight: '1.4'
                }
              }
            }
          ]
        }))
      },
      {
        id: 'input-form',
        type: 'form',
        props: {
          style: {
            display: 'flex',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }
        },
        events: {
          on_submit: true
        },
        children: [
          {
            id: 'username-input',
            type: 'input',
            props: {
              type: 'text',
              placeholder: 'Your name',
              required: true,
              style: {
                flex: '0 0 120px',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }
            }
          },
          {
            id: 'message-input',
            type: 'input',
            props: {
              type: 'text',
              placeholder: 'Type your message...',
              required: true,
              style: {
                flex: '1',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }
            }
          },
          {
            id: 'send-button',
            type: 'button',
            props: {
              text: 'Send',
              variant: 'primary',
              style: {
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            }
          }
        ]
      }
    ]
  };
}

// Handle UI requests
server.on('ui_request', (session, request) => {
  console.log(`UI request from ${session.id}:`, request);
  
  // Send initial chat UI
  const chatUI = createChatUI();
  server.sendUIResponse(session.id, {
    type: 'ui_response',
    request_id: request.request_id,
    components: [chatUI]
  });
});

// Handle event triggers
server.on('event_trigger', (session, event) => {
  console.log(`Event trigger from ${session.id}:`, event);
  
  if (event.component_id === 'input-form' && event.event_type === 'submit') {
    const formData = event.event_data as Record<string, string>;
    const username = formData['username-input'] || 'Anonymous';
    const messageText = formData['message-input'];
    
    if (messageText && messageText.trim()) {
      // Add message to store
      const newMessage = {
        id: (++messageCounter).toString(),
        user: username,
        text: messageText.trim(),
        timestamp: new Date()
      };
      
      messages.push(newMessage);
      
      // Keep only last 50 messages
      if (messages.length > 50) {
        messages.shift();
      }
      
      // Broadcast updated chat UI to all clients
      const updatedChatUI = createChatUI();
      server.broadcastUIResponse({
        type: 'ui_response',
        request_id: '',
        components: [updatedChatUI]
      });
      
      console.log(`New message from ${username}: ${messageText}`);
    }
  }
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start server
server.start().then(() => {
  console.log('🚀 MUP Chat Server started!');
  console.log('📡 WebSocket server: ws://localhost:3000/mup');
  console.log('🌐 Open http://localhost:3001 in your browser');
  console.log('💡 Run "npm run client" to start the web client');
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await server.stop();
    console.log('✅ Server stopped');
    process.exit(0);
  });
}