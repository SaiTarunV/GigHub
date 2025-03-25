import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Typography,
  Fade,
  Slide,
  Fab,
  Button,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ChatContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 80,
  right: 20,
  width: 350,
  height: 500,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  background: '#212121',
  border: '1px solid #A35C7A',
  borderRadius: '12px',
  overflow: 'hidden',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: '#A35C7A',
  color: '#FEF6EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const MessageBubble = styled('div')(({ theme, $isUser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1, 2),
  borderRadius: '12px',
  background: $isUser ? '#A35C7A' : '#2C2C2C',
  color: '#FEF6EB',
  alignSelf: $isUser ? 'flex-end' : 'flex-start',
}));

const ChatInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid #A35C7A',
  display: 'flex',
  gap: theme.spacing(1),
}));

const ContactForm = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const GigAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: 'Hello! I\'m GigAI, your career assistant. Please tell me which job you\'re interested in.',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [userSkills, setUserSkills] = useState('');
  const [isWaitingForSkills, setIsWaitingForSkills] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      text: input,
      isUser: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    if (!isInitialized) {
      if (!isWaitingForSkills) {
        // First message should be the job
        setSelectedJob(input);
        setIsWaitingForSkills(true);
        setMessages((prev) => [
          ...prev,
          {
            text: 'Great! Now, please list your current skills (comma-separated).',
            isUser: false,
          },
        ]);
      } else {
        // Second message should be the skills
        setUserSkills(input);
        setIsWaitingForSkills(false);
        setIsInitialized(true);
        initializeChat(input);
      }
    } else {
      try {
        const API_URL = process.env.NODE_ENV === 'production' 
          ? 'https://gighub-backend.onrender.com'
          : 'http://localhost:5000';

        const response = await fetch(`${API_URL}/api/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ message: input }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            text: data.response,
            isUser: false,
          },
        ]);
      } catch (error) {
        console.error('Error:', error);
        setMessages((prev) => [
          ...prev,
          {
            text: 'Sorry, there was an error processing your message. Please try again.',
            isUser: false,
          },
        ]);
      }
    }
  };

  const initializeChat = async (skills) => {
    try {
      const API_URL = process.env.NODE_ENV === 'production' 
        ? 'https://gighub-backend.onrender.com'
        : 'http://localhost:5000';

      const response = await fetch(`${API_URL}/api/chat/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ job: selectedJob, skills }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.message,
          isUser: false,
        },
      ]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setMessages((prev) => [
        ...prev,
        {
          text: 'Sorry, there was an error initializing the chat. Please try again later.',
          isUser: false,
        },
      ]);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#A35C7A',
          '&:hover': {
            background: '#8B4B66',
          },
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      <Fade in={isOpen}>
        <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
          <ChatContainer elevation={3}>
            <ChatHeader>
              <Typography variant="h6">GigAI</Typography>
              <IconButton
                size="small"
                onClick={() => setIsOpen(false)}
                sx={{ color: '#FEF6EB' }}
              >
                <CloseIcon />
              </IconButton>
            </ChatHeader>

            <ChatMessages>
              {messages.map((message, index) => (
                <MessageBubble key={index} $isUser={message.isUser}>
                  <Typography variant="body2">{message.text}</Typography>
                </MessageBubble>
              ))}
            </ChatMessages>

            <Divider sx={{ borderColor: '#A35C7A' }} />

            <ChatInput>
              <TextField
                fullWidth
                size="small"
                placeholder={isWaitingForSkills ? "Enter your skills (comma-separated)..." : "Type your message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isOpen}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FEF6EB',
                    '& fieldset': {
                      borderColor: '#A35C7A',
                    },
                    '&:hover fieldset': {
                      borderColor: '#8B4B66',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#A35C7A',
                    },
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || !isOpen}
                sx={{
                  color: '#A35C7A',
                  '&:hover': {
                    color: '#8B4B66',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </ChatInput>
          </ChatContainer>
        </Slide>
      </Fade>
    </>
  );
};

export default GigAI;