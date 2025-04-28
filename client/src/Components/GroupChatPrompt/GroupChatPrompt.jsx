import React, { useState, useEffect, useContext } from 'react';
import './GroupChatPrompt.css';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const GroupChatPrompt = ({socket}) => {
  const [groupName, setGroupName] = useState('');
  const { user, setIsPromptShow, isPromptShow } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchRes, setSearchRes] = useState([]);
  const [errMsg, setErrorMsg] = useState([]);

  // Reset form when closed
  useEffect(() => {
    if (!isPromptShow) {
      setGroupName('');
      setSearchTerm('');
      setSelectedUsers([]);
    }
  }, [isPromptShow]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const addUser = (user) => {
    // console.log(user)
    if (!selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchTerm('');
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((user) => user._id !== userId));
  };

  const handleCreateGroup = async () => {
    
    if(!groupName){
      errorHandle('Please provide a valid group name :)');
      return;
    }
    
    if (groupName && selectedUsers.length > 0) {
      const userIds = selectedUsers.map((obj) => obj._id);

      // Here you would typically make an API call to create the group
      try{
        const res = await axios.post(
          'http://localhost:8000/api/v1/chat/create-group',
          {
            name: groupName,
            userIds,
          },
          { withCredentials: true }
        );
        
        const newGroup = res.data.data.fullGroupChat;
        
        socket.emit('create group chat', {
          _id: newGroup._id,
          name: newGroup.name,
          participants: newGroup.participants,
          isGroupChat: true,
          groupAdmin: newGroup.groupAdmin._id
        });
  
        // Reset form
        setGroupName('');
        setSelectedUsers([]);
        setIsPromptShow(false)
        // onClose();
      }catch(err){
        errorHandle(err.response.data.message)
      }
     
    }
  };
  
  const errorHandle = (errMessage) => {
    setErrorMsg(errMessage)
    const timer = setTimeout(() => {
      setErrorMsg('')
    }, 3000)
    return () => clearTimeout(timer);
  }

  useEffect(() => {
    if (!searchTerm) {
      setSearchRes([]);
      return;
    }

    const localMatches = user.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (localMatches) {
      return;
    } else {
      axios
        .get(
          `http://localhost:8000/api/v1/users/get-user?search=${searchTerm.toLocaleLowerCase()}`,
          {
            withCredentials: true,
          }
        )
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
  }, [searchTerm, user]);
  

  return (
    <div className="group-chat-container">
      {isPromptShow && (
        <div className="group-chat-prompt">
          <div className="prompt-header">
            <h3>Create a New Group Chat</h3>
            <button
              className="close-btn"
              onClick={() => setIsPromptShow(false)}
            >
              ×
            </button>
          </div>

          <div className="prompt-body">
            <div className="input-group">
              <label htmlFor="group-name">Group Name</label>
              <input
                id="group-name"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
              />
            </div>

            <div className="selected-users">
              {selectedUsers.map((user) => (
                <div key={user._id} className="selected-user">
                  <span>
                    {user.avatar} {user.name}
                  </span>
                  <button onClick={() => removeUser(user._id)}>×</button>
                </div>
              ))}
            </div>

            <div className="input-group">
              <label htmlFor="user-search">Add Members</label>
              <input
                id="user-search"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search users..."
              />
            </div>

            {searchRes && (
              <div className="user-search-results">
                {searchRes.length >= 1 ? (
                  searchRes.map((user) => (
                    <div
                      key={user._id}
                      className="user-item"
                      onClick={() => addUser(user)}
                    >
                      <span>🤦🏼‍♂️</span>
                      <span>{user.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-results">{`No user Found (>_<)`}</div>
                )}
              </div>
            )}
          </div>
            { errMsg && <div className="err-msg">{errMsg}</div>}
          <div className="prompt-footer">
            <button
              onClick={() => setIsPromptShow(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              className="create-btn"
              onClick={() => {
                handleCreateGroup();
              }}
              disabled={!groupName || selectedUsers.length === 0}
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatPrompt;
