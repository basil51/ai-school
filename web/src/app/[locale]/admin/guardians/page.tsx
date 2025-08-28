'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface GuardianRelationship {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  createdAt: string;
  guardian: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  student: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function GuardiansPage() {
  const [relationships, setRelationships] = useState<GuardianRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [guardianEmail, setGuardianEmail] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/admin/guardians');
      if (response.ok) {
        const data = await response.json();
        setRelationships(data);
      } else {
        toast.error('Failed to fetch guardian relationships');
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to fetch guardian relationships');
    } finally {
      setLoading(false);
    }
  };

  const createRelationship = async () => {
    if (!guardianEmail || !studentEmail) {
      toast.error('Please fill in both guardian and student emails');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/guardians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guardianEmail,
          studentEmail,
        }),
      });

      if (response.ok) {
        const newRelationship = await response.json();
        setRelationships([newRelationship, ...relationships]);
        setGuardianEmail('');
        setStudentEmail('');
        setIsDialogOpen(false);
        toast.success('Guardian relationship created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create relationship');
      }
    } catch (error) {
      console.error('Error creating relationship:', error);
      toast.error('Failed to create guardian relationship');
    } finally {
      setCreating(false);
    }
  };

  const updateRelationshipStatus = async (relationshipId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/guardians', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationshipId,
          status,
        }),
      });

      if (response.ok) {
        const updatedRelationship = await response.json();
        setRelationships(relationships.map(rel => 
          rel.id === relationshipId ? updatedRelationship : rel
        ));
        toast.success('Relationship status updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update relationship');
      }
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast.error('Failed to update relationship status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, text: 'Pending' },
      approved: { variant: 'default' as const, text: 'Approved' },
      rejected: { variant: 'destructive' as const, text: 'Rejected' },
      revoked: { variant: 'destructive' as const, text: 'Revoked' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Guardian Relationships</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Guardian Relationship</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Guardian Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="guardianEmail">Guardian Email</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="guardian@example.com"
                />
              </div>
              <div>
                <Label htmlFor="studentEmail">Student Email</Label>
                <Input
                  id="studentEmail"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              <Button 
                onClick={createRelationship} 
                disabled={creating}
                className="w-full"
              >
                {creating ? 'Creating...' : 'Create Relationship'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {relationships.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No guardian relationships found. Create one to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          relationships.map((relationship) => (
            <Card key={relationship.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {relationship.guardian.name || relationship.guardian.email} ↔ {relationship.student.name || relationship.student.email}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      Created: {new Date(relationship.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(relationship.status)}
                    <Select
                      value={relationship.status}
                      onValueChange={(value) => updateRelationshipStatus(relationship.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Guardian</h4>
                    <p className="text-sm">{relationship.guardian.name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{relationship.guardian.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Student</h4>
                    <p className="text-sm">{relationship.student.name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{relationship.student.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
