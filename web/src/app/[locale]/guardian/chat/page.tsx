import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  MoreVertical,
  Search,
  //Filter,
  //Clock,
  CheckCircle,
  CheckCircle2,
  //User,
  //Users,
  BookOpen,
  //AlertCircle,
  Star,
  Calendar
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Teacher Chat | AI Teacher',
  description: 'Communicate with teachers about your children\'s progress',
};

// Mock data - in real app this would come from API
const teachers = [
  {
    id: '1',
    name: 'Ms. Sarah Williams',
    subject: 'Mathematics',
    avatar: '/avatars/teacher1.jpg',
    status: 'online',
    lastMessage: 'Sarah has been doing great in algebra!',
    lastMessageTime: '2 hours ago',
    unreadCount: 2,
    children: ['Sarah Johnson'],
    rating: 4.8,
    responseTime: 'Usually responds within 1 hour'
  },
  {
    id: '2',
    name: 'Mr. David Chen',
    subject: 'Science',
    avatar: '/avatars/teacher2.jpg',
    status: 'away',
    lastMessage: 'Michael showed excellent understanding of photosynthesis',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    children: ['Michael Johnson'],
    rating: 4.9,
    responseTime: 'Usually responds within 2 hours'
  },
  {
    id: '3',
    name: 'Ms. Emily Rodriguez',
    subject: 'English',
    avatar: '/avatars/teacher3.jpg',
    status: 'offline',
    lastMessage: 'Both children are progressing well in reading comprehension',
    lastMessageTime: '3 days ago',
    unreadCount: 1,
    children: ['Sarah Johnson', 'Michael Johnson'],
    rating: 4.7,
    responseTime: 'Usually responds within 4 hours'
  }
];

const recentMessages = [
  {
    id: '1',
    sender: 'Ms. Sarah Williams',
    message: 'Sarah has been doing great in algebra! She scored 92% on her last quiz.',
    timestamp: '2 hours ago',
    isRead: false,
    type: 'text'
  },
  {
    id: '2',
    sender: 'You',
    message: 'That\'s wonderful! She\'s been practicing extra problems at home.',
    timestamp: '1 hour ago',
    isRead: true,
    type: 'text'
  },
  {
    id: '3',
    sender: 'Ms. Sarah Williams',
    message: 'I can see the improvement. Keep up the great work!',
    timestamp: '30 minutes ago',
    isRead: false,
    type: 'text'
  }
];

export default function TeacherChatPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Teachers List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Teacher Chat</h1>
            <Button size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search teachers..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teachers List */}
          <div className="space-y-2 overflow-y-auto">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} />
                        <AvatarFallback>{teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        teacher.status === 'online' ? 'bg-green-500' : 
                        teacher.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{teacher.name}</h3>
                        {teacher.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {teacher.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{teacher.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{teacher.lastMessageTime}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-muted-foreground">{teacher.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/avatars/teacher1.jpg" alt="Ms. Sarah Williams" />
                    <AvatarFallback>SW</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Ms. Sarah Williams</CardTitle>
                    <CardDescription>Mathematics Teacher • Online</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${message.sender === 'You' ? 'order-2' : 'order-1'}`}>
                    {message.sender !== 'You' && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="/avatars/teacher1.jpg" alt={message.sender} />
                          <AvatarFallback>SW</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{message.sender}</span>
                      </div>
                    )}
                    <div className={`p-3 rounded-lg ${
                      message.sender === 'You' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <div className={`flex items-center space-x-1 mt-1 ${
                      message.sender === 'You' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      {message.sender === 'You' && (
                        <div className="flex items-center">
                          {message.isRead ? (
                            <CheckCircle2 className="h-3 w-3 text-blue-500" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Textarea 
                  placeholder="Type your message..." 
                  className="min-h-[60px] resize-none"
                  rows={2}
                />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>Usually responds within 1 hour</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Quick Questions</h3>
                <p className="text-sm text-muted-foreground">Ask about homework or progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Schedule Meeting</h3>
                <p className="text-sm text-muted-foreground">Request a parent-teacher conference</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Academic Support</h3>
                <p className="text-sm text-muted-foreground">Get help with learning strategies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
