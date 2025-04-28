// Chat.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import './Chat.css';
import GroupChatPrompt from '../GroupChatPrompt/GroupChatPrompt';

const Chat = () => {
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [latestMessages, setLatestMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeGroupChat, setActiveGroupChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [isActiveSelected, setIsActiveSelected] = useState();

  const { user, setIsPromptShow, isPromptShow } = useContext(AuthContext);
  const socket = useRef();
  const messageEndRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';
  const SOCKET_URL = 'http://localhost:8000';

  // Helper functions
  const getChatId = (chat) => chat?.id || chat?._id;
  const isUserInList = (list, id) =>
    list.some((u) => u.id === id || u._id === id);

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp || Date.now());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (activeChat) {
      const isOnline = users.some((u) => u.isActive && u.id === activeChat.id);
      setIsActiveSelected(isOnline ? 'online' : 'offline');
    }
  }, [users, activeChat]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !user._id) return;

    // Initialize socket connection
    socket.current = io(SOCKET_URL, { withCredentials: true });

    // Handle connection errors
    socket.current.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
    });

    // Set up user in socket
    socket.current.on('connect', () => {
      socket.current.emit('setup', user);
    });

    socket.current.on('online users', (onlineUserIds) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          isActive: onlineUserIds.includes(user?.userId?.toString()),
        }))
      );

      // Also update active chat status if it exists
      if (activeChat && activeChat.userId) {
        setIsActiveSelected(
          onlineUserIds.includes(activeChat.userId.toString())
            ? 'online'
            : 'offline'
        );
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user, activeChat]);

  // Helper function to add new chat to list
  const addNewChatToList = (chat) => {
    if (chat.isGroupChat) {
      const newGroup = {
        id: chat._id,
        name: chat.name,
        avatar: chat.name?.[0] || 'U',
        isGroupChat: true,
        members: chat.participants || [],
      };

      setGroups((prev) => [newGroup, ...prev]);
    } else {
      const other = chat.participants.find((p) => p._id !== user._id);

      const newDirectChat = {
        id: chat._id,
        name: other?.name || 'Gods Know',
        avatar: (other?.name && other.name[0]) || 'U',
        email: other?.email || '',
        profilePic: other?.profilePic || '',
        isActive: false,
        status: 'online',
        isGroupChat: false,
        userId: other?._id,
      };

      setUsers((prev) => [newDirectChat, ...prev]);
    }
  };

  // Helper function to refresh chat list
  const refreshChatList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/chat/get-all-chats`, {
        withCredentials: true,
      });

      const allChats = res.data?.data?.chats || [];
      const allGroups = res.data?.data?.groupChats || [];

      const directChat = allChats
        .filter((chat) => !chat.isGroupChat)
        .map((chat) => {
          const other = chat.participants.find((p) => p._id !== user._id);
          return {
            id: chat._id,
            name: other?.name || 'Gods Know',
            avatar: (other?.name && other.name[0]) || 'U',
            email: other?.email || '',
            profilePic: other?.profilePic || '',
            isActive: false,
            status: 'online',
            isGroupChat: false,
            userId: other?._id,
          };
        });

      const groupChat = allGroups.map((chat) => ({
        id: chat._id,
        name: chat.name,
        avatar: chat.name?.[0] || 'U',
        isGroupChat: true,
        members: chat.participants || [],
      }));

      setUsers(directChat);
      setGroups(groupChat);
    } catch (err) {
      console.error('❌ Failed to fetch chats:', err);
    }
  };

  // Fetch all chats when user changes
  useEffect(() => {
    if (!user || !user.email) return;

    const fetchChats = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/v1/chat/get-all-chats`,
          { withCredentials: true }
        );

        const chats = res.data?.data?.chats || [];
        const groupChats = res.data?.data?.groupChats || [];

        // Process latest messages
        const latestMsgs = {};
        [...chats, ...groupChats].forEach((chat) => {
          latestMsgs[chat._id] = chat.latestMessage?.content || '';
        });
        setLatestMessages(latestMsgs);

        // Join all chat rooms
        [...chats, ...groupChats].forEach((chat) => {
          if (socket.current) {
            socket.current.emit('join chat', chat._id);
          }
        });

        // Process direct chats and group chats
        const directChat = chats
          .filter((chat) => !chat.isGroupChat)
          .map((chat) => {
            const other =
              chat.participants.find((p) => p.email !== user.email) || {};
            return {
              id: chat._id,
              name: other.name || 'Gods Know',
              avatar: (other.name && other.name[0]) || 'U',
              email: other.email || '',
              profilePic: other.profilePic || '',
              isActive: false,
              status: 'online',
              isGroupChat: false,
              members: '2',
              userId: other?._id,
            };
          });

        const groupChat = chats
          .filter((chat) => chat.isGroupChat)
          .map((chat) => ({
            id: chat._id,
            name: chat.name,
            avatar: chat.name?.[0] || 'U',
            isGroupChat: true,
            members: chat.participants || [],
            groupAdmin: chat.groupAdmin || '',
          }));

        setUsers(directChat);
        setGroups(groupChat);
      } catch (err) {
        console.log(`Failed to fetch chats: ${err}`);
      }
    };

    fetchChats();
  }, [user]);

  // Handle socket events for messages and notifications
  useEffect(() => {
    if (!socket.current) return;

    const chatId = getChatId(activeChat);
    const groupId = getChatId(activeGroupChat);

    if (chatId) {
      socket.current.emit('join chat', chatId);
    }

    if (groupId) {
      socket.current.emit('join chat', groupId);
    }

    // Handle receiving a message
    const handleMessageReceived = async (message) => {
      const isCurrentUser = message.sender._id === user._id;
      const chatId = message.chatId;
      const currentChatId = getChatId(activeChat);
      const currentGroupChatId = getChatId(activeGroupChat);

      // Show in current chat
      if (chatId === currentChatId || chatId === currentGroupChatId) {
        setMessages((prev) => [...prev, { ...message, isCurrentUser }]);
      } else {
        setLatestMessages((prev) => ({
          ...prev,
          [chatId]: message.content,
        }));

        // Check if chat exists, if not fetch to update
        const chatExists =
          users.some((u) => u.id === chatId) ||
          groups.some((g) => g.id === chatId);

        if (!chatExists) {
          await refreshChatList();
        }
      }
    };

    // Handle new message notifications
    const handleNewMessageNotification = (data) => {
      const chatId = data.chatId;

      // Update latest message
      setLatestMessages((prev) => ({
        ...prev,
        [chatId]: data.message.content,
      }));

      // Check if the chat exists in our lists
      const chatExists =
        users.some((u) => u.id === chatId) ||
        groups.some((g) => g.id === chatId);

      // Update unread counts
      const isNotFromAnyActiveChat =
        (!activeChat || activeChat.id !== chatId) &&
        (!activeGroupChat || activeGroupChat.id !== chatId);

      if (!chatExists || isNotFromAnyActiveChat) {
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }

      // If not, add the chat to lists
      if (!chatExists) {
        addNewChatToList(data.chat);
      }
    };

    // Handle new group creation
    const handleNewGroupCreated = (groupData) => {
      const newGroup = {
        id: groupData._id,
        name: groupData.name,
        avatar: groupData.name?.[0] || 'U',
        isGroupChat: true,
        members: groupData.participants || [],
        groupAdmin: groupData.groupAdmin || '',
      };

      // Check if the group already exists
      if (!groups.some((g) => g.id === groupData._id)) {
        setGroups((prev) => [newGroup, ...prev]);
      }
    };

    // In handleNewDirectChat function
    const handleNewDirectChat = (chatData) => {
      const other = chatData.participants.find((p) => p._id !== user._id);
      const newDirectChat = {
        id: chatData._id,
        name: other?.name || 'Gods knows',
        avatar: (other?.name && other.name[0]) || 'U',
        email: other?.email || '',
        profilePic: other?.profilePic || '',
        isActive: false,
        status: 'online',
        isGroupChat: false,
        userId: other?._id,
      };

      // Check if the chat already exists
      if (!users.some((u) => u.id === chatData._id)) {
        setUsers((prev) => [newDirectChat, ...prev]);

        // Request update of online status
        setTimeout(() => {
          socket.current.emit('get-online-users');
        }, 200);
      }
    };

    // Set up event listeners
    socket.current.on('message received', handleMessageReceived);
    socket.current.on('new message notification', handleNewMessageNotification);
    socket.current.on('new group created', handleNewGroupCreated);
    socket.current.on('new direct chat', handleNewDirectChat);

    // Cleanup event listeners
    return () => {
      if (socket.current) {
        socket.current.off('message received', handleMessageReceived);
        socket.current.off(
          'new message notification',
          handleNewMessageNotification
        );
        socket.current.off('new group created', handleNewGroupCreated);
        socket.current.off('new direct chat', handleNewDirectChat);
      }
    };
  }, [
    activeChat,
    activeGroupChat,
    user,
    users,
    groups,
    addNewChatToList,
    refreshChatList,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchRes([]);
      return;
    }

    const localMatches = users.filter((u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localMatches.length > 0) {
      setSearchRes(localMatches);
    } else {
      axios
        .get(`${API_BASE_URL}/api/v1/users/get-user?search=${searchTerm}`, {
          withCredentials: true,
        })
        .then((res) => {
          setSearchRes(res.data?.data?.users || []);
        })
        .catch((err) => {
          console.error(
            '😪 Error: ' + err?.response?.data?.message || err.message
          );
          setSearchRes([]);
        });
    }
  }, [searchTerm, users]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || (!activeChat && !activeGroupChat)) return;

    const message = {
      chatId: activeChat?.id || activeGroupChat?.id,
      content: newMessage,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };

    socket.current.emit('send-message', message);
    setNewMessage('');

    setLatestMessages((prev) => ({
      ...prev,
      [message.chatId]: message.content,
    }));
  };

  // Chat selection handler
  const handleChatSelect = async (chatUser) => {
    try {
      if (!chatUser) return;

      const existingChat = users.find(
        (u) =>
          (u.id && chatUser.id && u.id === chatUser.id) ||
          (u.id && chatUser._id && u.id === chatUser._id) ||
          (u._id && chatUser._id && u._id === chatUser._id)
      );

      const existingGroup = groups.find(
        (u) => u.id && chatUser.id && u.id === chatUser.id
      );

      const chatId = existingChat?.id || chatUser.id || chatUser._id;

      // Reset unread msg count when chat opens
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });

      if (existingChat) {
        setIsActiveSelected(existingChat.isActive ? 'online' : 'offline');
        setActiveChat(existingChat);
        setActiveGroupChat(null);
      } else if (existingGroup) {
        setActiveChat(null);
        setActiveGroupChat(existingGroup);
      } else {
        // Create new chat if it doesn't exist
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/chat/create`,
          { userId: chatUser._id || chatUser.id },
          { withCredentials: true }
        );

        const newChat = res.data.data.newChat;

        const formattedChat = {
          id: newChat._id,
          name: chatUser.name || 'Unknown',
          avatar: (chatUser.name && chatUser.name[0]) || 'U',
          email: chatUser.email || '',
          profilePic: chatUser.profilePic || '',
          isActive: true,
          status: 'online',
        };

        if (!isUserInList(users, newChat._id)) {
          setUsers((prev) => [formattedChat, ...prev]);
        }

        setActiveChat(formattedChat);

        // Emit event for creating a new direct chat
        socket.current.emit('create direct chat', {
          _id: newChat._id,
          participants: newChat.participants.map((p) => p || p),
          name: chatUser.name || 'Unknown',
          isGroupChat: false,
        });
      }

      // Fetch messages for the selected chat
      const msgRes = await axios.get(
        `${API_BASE_URL}/api/v1/messages/${chatId}`,
        { withCredentials: true }
      );
      setMessages(msgRes.data?.data?.messages || []);

      // Join the chat room
      if (socket.current) {
        socket.current.emit('join chat', chatId);
      }
    } catch (err) {
      console.error('Error selecting/creating chat:', err);
    }
  };

  // Delete chat handler
  const handleChatDelete = async (chatId) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/v1/chat/delete-chat?chatId=${chatId}`,
        {
          withCredentials: true,
        }
      );
      if (res.data.status === 'success') {
        if (activeChat) {
          setActiveChat(null);
          setUsers(users.filter((u) => u.id.toString() !== chatId));
        } else if (activeGroupChat) {
          setActiveGroupChat(null);
          setGroups(groups.filter((g) => g.id.toString() !== chatId));
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  // Exit group handler
  const handleExitGroup = async (chatId) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/v1/chat/exit-group?chatId=${chatId}&userId=${user._id}`,
        {
          withCredentials: true,
        }
      );
      if (res.data.status === 'success') {
        if (activeGroupChat) {
          setActiveGroupChat(null);
          setGroups(groups.filter((g) => g.id.toString() !== chatId));
        }
      }
    } catch (err) {
      console.error('Error exiting group:', err);
    }
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="sidebar">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="chat-sections">
            <div className="section">
              <div className="section-header">
                <h3>Direct Messages</h3>
              </div>
              <ul className="contact-list">
                {(searchTerm ? searchRes : users).map((user, index) => (
                  <li
                    key={user.id || user._id || index}
                    className={`contact-item `}
                    onClick={() => handleChatSelect(user)}
                  >
                    <div
                      className={`avatar ${
                        user.isActive ? 'online' : 'offline'
                      }`}
                    >
                      {user.name?.[0] || 'U'}
                    </div>

                    <div className="contact-info">
                      <h4>
                        {user.name || 'Unknown'}{' '}
                        {unreadCounts[user.id] > 0 && (
                          <span className="unread-container">
                            <span className="rounded-pill">
                              {unreadCounts[user.id]}
                            </span>
                          </span>
                        )}
                      </h4>

                      <p className="latest-msg">
                        {latestMessages[user.id] || ''}
                      </p>
                      <p className="status">
                        {user.isActive ? 'online' : 'offline'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="section">
              {isPromptShow && <GroupChatPrompt socket={socket.current} />}
              <div className="section-header">
                <h3>Groups</h3>
                <div
                  onClick={() => setIsPromptShow(true)}
                  style={{ cursor: 'pointer' }}
                >
                  ➕
                </div>
              </div>
              <ul className="contact-list">
                {filteredGroups.map((group) => (
                  <li
                    key={group.id || group._id}
                    className={`contact-item ${group.isActive ? 'active' : ''}`}
                    onClick={() => handleChatSelect(group)}
                  >
                    <div className="avatar group">{group.avatar}</div>
                    <div className="contact-info">
                      <h4>
                        {group.name}
                        {unreadCounts[group.id] > 0 && (
                          <span className="unread-container">
                            <span className="rounded-pill">
                              {unreadCounts[group.id]}
                            </span>
                          </span>
                        )}
                      </h4>
                      <p className="members">{group.members.length} members</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {activeChat || activeGroupChat ? (
          <div className="chat-main">
            <div className="chat-header">
              <div className="chat-info">
                <div className={`avatar ${isActiveSelected}`}>
                  {activeChat?.avatar || activeGroupChat?.avatar}
                </div>
                <div>
                  <h2>
                    {activeChat?.name || activeGroupChat?.name || 'Unknown'}
                  </h2>
                  <p>{isActiveSelected}</p>
                </div>
              </div>
              <i
                onClick={() => {
                  if (activeChat) {
                    handleChatDelete(activeChat.id || activeChat._id);
                  } else if (activeGroupChat) {
                    handleChatDelete(activeGroupChat.id || activeGroupChat._id);
                  }
                }}
                className={
                  activeChat || activeGroupChat?.groupAdmin === user._id
                    ? 'fa-solid fa-trash-can fa-xl trash-icon'
                    : ''
                }
              ></i>
              {activeGroupChat?.groupAdmin !== user._id && !activeChat ? (
                <i
                  className={'fa-solid fa-right-from-bracket fa-xl'}
                  style={{ color: '#ffffff', cursor: 'pointer' }}
                  onClick={() => handleExitGroup(activeGroupChat.id)}
                ></i>
              ) : (
                ''
              )}
            </div>

            <div className="messages-container">
              <div className="messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.sender && message.sender._id === user._id
                        ? 'outgoing'
                        : 'incoming'
                    }`}
                  >
                    {message.sender && message.sender._id !== user._id && (
                      <div className="avatar">
                        {message.sender.name ? message.sender.name[0] : 'U'}
                      </div>
                    )}
                    <div className="message-content">
                      {message.sender && message.sender._id !== user._id && (
                        <p className="sender-name">
                          {message.sender.name || 'Unknown'}
                        </p>
                      )}
                      <div className="message-bubble">
                        <p>{message.content}</p>
                      </div>
                      <span className="timestamp">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            </div>

            <div className="message-input-container">
              <form onSubmit={handleSendMessage}>
                <div className="message-input">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>
                <button type="submit" className="send-btn"></button>
              </form>
            </div>
          </div>
        ) : (
          <div className="chat-main no-chat-selected">
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              Please select a chat to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
