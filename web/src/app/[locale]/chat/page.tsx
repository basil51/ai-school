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
import { Users } from "lucide-react";


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
      router.push(`/${locale}/signin`);
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
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">{dict?.chat?.loading || "Loading..."}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
        {/* Sidebar - Chat Rooms */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{dict?.chat?.rooms || "Chat Rooms"}</CardTitle>
                <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      {dict?.chat?.createRoom || "Create Room"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{dict?.chat?.createNewRoom || "Create New Room"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          {dict?.chat?.roomName || "Room Name"}
                        </label>
                        <Input
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder={dict?.chat?.roomNamePlaceholder || "Enter room name"}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          {dict?.chat?.description || "Description"}
                        </label>
                        <Textarea
                          value={newRoomDescription}
                          onChange={(e) => setNewRoomDescription(e.target.value)}
                          placeholder={dict?.chat?.descriptionPlaceholder || "Enter room description"}
                          rows={3}
                        />
                      </div>
                      <Button onClick={createRoom} className="w-full">
                        {dict?.chat?.createRoom || "Create Room"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg transition-colors ${
                        selectedRoom?.id === room.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedRoom(room)}
                        >
                          <h4 className="font-medium">{room.name}</h4>
                          {room.description && (
                            <p className="text-sm opacity-80 truncate">{room.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {room._count.participants}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoom(room.id);
                            }}
                            className="h-8 w-8 p-0 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 border border-red-300 hover:border-red-400 rounded-full text-lg font-bold"
                            title={dict?.chat?.deleteRoom || "Delete Room"}
                          >
                            ×
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
          <Card className="h-full flex flex-col">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedRoom.name}</CardTitle>
                      <CardDescription>
                        {selectedRoom.description || dict?.chat?.generalChat || "General chat room"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {participants.length} {dict?.chat?.participants || "participants"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowParticipants(true);
                          fetchAvailableUsers(selectedRoom.id);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {dict?.chat?.manageParticipants || "Manage Participants"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[calc(100vh-300px)] p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {message.sender.name?.charAt(0) || message.sender.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{message.sender.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {message.sender.role}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={dict?.chat?.typeMessage || "Type your message..."}
                      className="flex-1"
                      rows={1}
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                      {sending ? dict?.chat?.sending || "Sending..." : dict?.chat?.send || "Send"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">
                    {dict?.chat?.selectRoom || "Select a Chat Room"}
                  </h3>
                  <p className="text-muted-foreground">
                    {dict?.chat?.selectRoomDescription || "Choose a room from the sidebar to start chatting"}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Participant Management Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dict?.chat?.manageParticipants || "Manage Participants"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{dict?.chat?.currentParticipants || "Current Participants"}</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">{participant.user.name}</p>
                      <p className="text-xs text-muted-foreground">{participant.user.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeParticipant(participant.user.id)}
                    >
                      {dict?.chat?.remove || "Remove"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">{dict?.chat?.addParticipants || "Add Participants"}</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableUsers
                  .filter(user => !currentParticipants.includes(user.id))
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
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
                      <label htmlFor={user.id} className="text-sm cursor-pointer">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowParticipants(false)}>
                {dict?.common?.cancel || "Cancel"}
              </Button>
              <Button onClick={addParticipants} disabled={selectedUsers.length === 0}>
                {dict?.chat?.addSelected || "Add Selected"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
