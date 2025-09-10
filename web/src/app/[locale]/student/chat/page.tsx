"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Send, 
  MoreVertical,
  Trash2,
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle,
  Sparkles
} from "lucide-react";


interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  _count: {
    messages: number;
    participants: number;
  };
  participants: ChatParticipant[];
}

interface ChatParticipant {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  joinedAt: string;
  lastReadAt?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  messageType: 'text' | 'system' | 'notification';
  isEdited: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { dict } = useTranslations();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        
        // Auto-select the first room if available
        if (data.length > 0 && !selectedRoom) {
          setSelectedRoom(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error(dict?.chat?.errorFetchingRooms || "Error fetching chat rooms");
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, dict?.chat?.errorFetchingRooms]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
      return;
    }

    fetchRooms();
  }, [status, router, locale, fetchRooms]);

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(dict?.chat?.errorFetchingMessages || "Error fetching messages");
    }
  }, [dict?.chat?.errorFetchingMessages]);

  const fetchParticipants = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/participants?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      fetchParticipants(selectedRoom.id);
    }
  }, [selectedRoom, fetchMessages, fetchParticipants]);

  const sendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
      } else {
        const errorData = await response.json();
        console.error('Send message error:', errorData);
        toast.error(errorData.error || dict?.chat?.errorSendingMessage || "Error sending message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(dict?.chat?.errorSendingMessage || "Error sending message");
    } finally {
      setSending(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        const room = await response.json();
        setRooms(prev => [room, ...prev]);
        setSelectedRoom(room);
        setNewRoomName("");
        setNewRoomDescription("");
        setShowCreateRoom(false);
        toast.success(dict?.chat?.roomCreated || "Chat room created successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || dict?.chat?.errorCreatingRoom || "Error creating room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error(dict?.chat?.errorCreatingRoom || "Error creating room");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm(dict?.chat?.confirmDeleteRoom || "Are you sure you want to delete this room?")) return;

    try {
      const response = await fetch(`/api/chat/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRooms(prev => prev.filter(room => room.id !== roomId));
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
        }
        toast.success(dict?.chat?.roomDeleted || "Room deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || dict?.chat?.errorDeletingRoom || "Error deleting room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error(dict?.chat?.errorDeletingRoom || "Error deleting room");
    }
  };

  const fetchAvailableUsers = async (roomId?: string) => {
    try {
      const url = roomId ? `/api/chat/users?roomId=${roomId}` : "/api/chat/users";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users);
        setCurrentParticipants(data.currentParticipants || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addParticipants = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const promises = selectedUsers.map(userId =>
        fetch("/api/chat/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: selectedRoom!.id,
            userId,
          }),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        toast.success(dict?.chat?.participantsAdded || `${successCount} participant(s) added successfully`);
        setSelectedUsers([]);
        setShowParticipants(false);
        fetchParticipants(selectedRoom!.id);
        fetchRooms(); // Refresh room list to update participant count
      }
    } catch (error) {
      console.error("Error adding participants:", error);
      toast.error(dict?.chat?.errorAddingParticipants || "Error adding participants");
    }
  };

  const removeParticipant = async (userId: string) => {
    try {
      const response = await fetch(`/api/chat/participants?roomId=${selectedRoom!.id}&userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(dict?.chat?.participantRemoved || "Participant removed successfully");
        fetchParticipants(selectedRoom!.id);
        fetchRooms(); // Refresh room list to update participant count
      } else {
        const error = await response.json();
        toast.error(error.error || dict?.chat?.errorRemovingParticipant || "Error removing participant");
      }
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error(dict?.chat?.errorRemovingParticipant || "Error removing participant");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
      <div className="p-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Study Chat
                </h1>
                <p className="text-gray-600 mt-2">
                  Connect with teachers and peers for collaborative learning
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar - Chat Rooms */}
            <div className="lg:col-span-2">
              <Card className="h-full bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-pink-600" />
                      {dict?.chat?.rooms || "Chat Rooms"}
                    </CardTitle>
                    <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          {dict?.chat?.createRoom || "Create Room"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white/90 backdrop-blur-lg border-0 shadow-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-pink-600" />
                            {dict?.chat?.createNewRoom || "Create New Room"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              {dict?.chat?.roomName || "Room Name"}
                            </label>
                            <Input
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              placeholder={dict?.chat?.roomNamePlaceholder || "Enter room name"}
                              className="bg-white/80 backdrop-blur-lg border-0 shadow-lg"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              {dict?.chat?.description || "Description"}
                            </label>
                            <Textarea
                              value={newRoomDescription}
                              onChange={(e) => setNewRoomDescription(e.target.value)}
                              placeholder={dict?.chat?.descriptionPlaceholder || "Enter room description"}
                              rows={3}
                              className="bg-white/80 backdrop-blur-lg border-0 shadow-lg"
                            />
                          </div>
                          <Button 
                            onClick={createRoom} 
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {dict?.chat?.createRoom || "Create Room"}
                          </Button>
                        </div>
                      </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className={`p-4 rounded-xl transition-all duration-300 cursor-pointer group ${
                            selectedRoom?.id === room.id
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                              : "bg-white/60 hover:bg-white/80 hover:shadow-md"
                          }`}
                          onClick={() => setSelectedRoom(room)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${selectedRoom?.id === room.id ? 'text-white' : 'text-gray-800 group-hover:text-pink-700'} transition-colors`}>
                                {room.name}
                              </h4>
                              {room.description && (
                                <p className={`text-sm mt-1 truncate ${selectedRoom?.id === room.id ? 'text-white/80' : 'text-gray-600'}`}>
                                  {room.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 min-w-fit">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${selectedRoom?.id === room.id ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-800'}`}
                              >
                                <Users className="w-3 h-3 mr-1" />
                                {room._count.participants}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRoom(room.id);
                                }}
                                className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 ${
                                  selectedRoom?.id === room.id 
                                    ? 'bg-white/20 text-white hover:bg-white/30' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                                title={dict?.chat?.deleteRoom || "Delete Room"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
          </Card>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <Card className="h-full flex flex-col bg-white/80 backdrop-blur-lg border-0 shadow-lg">
                {selectedRoom ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="border-b border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-pink-600" />
                            {selectedRoom.name}
                          </CardTitle>
                          <CardDescription>
                            {selectedRoom.description || dict?.chat?.generalChat || "General chat room"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">
                            <Users className="w-3 h-3 mr-1" />
                            {participants.length} {dict?.chat?.participants || "participants"}
                          </Badge> 
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowParticipants(true);
                              fetchAvailableUsers(selectedRoom.id);
                            }}
                            className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {dict?.chat?.manageParticipants || "Manage Participants"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardContent className="flex-1 p-0">
                      <ScrollArea className="h-[400px] p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className="flex items-start space-x-3 group">
                              <Avatar className="w-10 h-10 ring-2 ring-pink-200">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold">
                                  {message.sender.name?.charAt(0) || message.sender.email.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-800">{message.sender.name}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      message.sender.role === 'teacher' 
                                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                        : 'bg-green-100 text-green-800 border-green-200'
                                    }`}
                                  >
                                    {message.sender.role}
                                  </Badge>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(message.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm group-hover:shadow-md transition-all duration-300">
                                  <p className="text-sm text-gray-700">{message.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200/50">
                      <div className="flex space-x-3">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={dict?.chat?.typeMessage || "Type your message..."}
                          className="flex-1 bg-white/80 backdrop-blur-lg border-0 shadow-lg resize-none"
                          rows={1}
                        />
                        <Button 
                          onClick={sendMessage} 
                          disabled={sending || !newMessage.trim()}
                          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          {sending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {dict?.chat?.sending || "Sending..."}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {dict?.chat?.send || "Send"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                  ) : (
                    <CardContent className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <MessageSquare className="h-10 w-10 text-pink-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">
                          {dict?.chat?.selectRoom || "Select a Chat Room"}
                        </h3>
                        <p className="text-gray-600">
                          {dict?.chat?.selectRoomDescription || "Choose a room from the sidebar to start chatting"}
                        </p>
                      </div>
                    </CardContent>
                  )}
              </Card>
            </div>
            </div>
          </div>

          {/* Participant Management Dialog */}
          <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
            <DialogContent className="max-w-md bg-white/90 backdrop-blur-lg border-0 shadow-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-pink-600" />
                  {dict?.chat?.manageParticipants || "Manage Participants"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">{dict?.chat?.currentParticipants || "Current Participants"}</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{participant.user.name}</p>
                          <p className="text-xs text-gray-600">{participant.user.role}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeParticipant(participant.user.id)}
                          className="bg-red-100 text-red-700 hover:bg-red-200 border-0 shadow-sm"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          {dict?.chat?.remove || "Remove"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">{dict?.chat?.addParticipants || "Add Participants"}</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableUsers
                      .filter(user => !currentParticipants.includes(user.id))
                      .map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(prev => [...prev, user.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <label htmlFor={user.id} className="text-sm cursor-pointer flex-1">
                            <div>
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-600">{user.role}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowParticipants(false)}
                    className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {dict?.common?.cancel || "Cancel"}
                  </Button>
                  <Button 
                    onClick={addParticipants} 
                    disabled={selectedUsers.length === 0}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {dict?.chat?.addSelected || "Add Selected"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
}
