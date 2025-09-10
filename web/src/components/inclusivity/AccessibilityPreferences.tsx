'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Eye, 
  Ear, 
  Zap, 
  Globe, 
  Settings, 
  Save, 
  Clock,
  Type,
  Palette,
  Volume2,
  BookOpen,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface AccessibilityProfile {
  id?: string;
  userId: string;
  organizationId: string;
  
  // Learning Preferences
  hasADHD: boolean;
  hasDyslexia: boolean;
  hasAutism: boolean;
  hasHearingImpairment: boolean;
  hasVisualImpairment: boolean;
  hasMobilityImpairment: boolean;
  isESL: boolean;
  
  // Pacing Preferences
  preferredPacing: string;
  breakFrequency: number;
  maxSessionLength: number;
  
  // Visual Preferences
  preferredFontSize: string;
  preferredColorScheme: string;
  highContrast: boolean;
  reducedMotion: boolean;
  
  // Content Preferences
  simplifiedLanguage: boolean;
  extraExplanations: boolean;
  visualAids: boolean;
  audioSupport: boolean;
  
  // Cultural Preferences
  primaryLanguage: string;
  culturalContext?: string;
  religiousConsiderations?: string;
}

export function AccessibilityPreferences() {
  const [profile, setProfile] = useState<AccessibilityProfile>({
    userId: '',
    organizationId: '',
    hasADHD: false,
    hasDyslexia: false,
    hasAutism: false,
    hasHearingImpairment: false,
    hasVisualImpairment: false,
    hasMobilityImpairment: false,
    isESL: false,
    preferredPacing: 'standard',
    breakFrequency: 15,
    maxSessionLength: 45,
    preferredFontSize: 'medium',
    preferredColorScheme: 'standard',
    highContrast: false,
    reducedMotion: false,
    simplifiedLanguage: false,
    extraExplanations: false,
    visualAids: true,
    audioSupport: true,
    primaryLanguage: 'en',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/inclusivity/accessibility-profiles');
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      if (data.profiles && data.profiles.length > 0) {
        setProfile(data.profiles[0]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show error toast for initial load
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/inclusivity/accessibility-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      toast.success('Accessibility preferences saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (updates: Partial<AccessibilityProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Preferences</h1>
          <p className="text-gray-600">
            Customize your learning experience to match your needs and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="learning" className="space-y-6">
        <TabsList>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Learning Needs
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visual Preferences
          </TabsTrigger>
          <TabsTrigger value="pacing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pacing & Timing
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content Preferences
          </TabsTrigger>
          <TabsTrigger value="cultural" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Cultural & Language
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Learning Needs & Accommodations
              </CardTitle>
              <CardDescription>
                Tell us about your learning needs so we can provide the best experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Learning Differences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="adhd">ADHD</Label>
                      <Switch
                        id="adhd"
                        checked={profile.hasADHD}
                        onCheckedChange={(checked) => updateProfile({ hasADHD: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dyslexia">Dyslexia</Label>
                      <Switch
                        id="dyslexia"
                        checked={profile.hasDyslexia}
                        onCheckedChange={(checked) => updateProfile({ hasDyslexia: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autism">Autism Spectrum</Label>
                      <Switch
                        id="autism"
                        checked={profile.hasAutism}
                        onCheckedChange={(checked) => updateProfile({ hasAutism: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Sensory & Physical Needs</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hearing">Hearing Impairment</Label>
                      <Switch
                        id="hearing"
                        checked={profile.hasHearingImpairment}
                        onCheckedChange={(checked) => updateProfile({ hasHearingImpairment: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="visual">Visual Impairment</Label>
                      <Switch
                        id="visual"
                        checked={profile.hasVisualImpairment}
                        onCheckedChange={(checked) => updateProfile({ hasVisualImpairment: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mobility">Mobility Impairment</Label>
                      <Switch
                        id="mobility"
                        checked={profile.hasMobilityImpairment}
                        onCheckedChange={(checked) => updateProfile({ hasMobilityImpairment: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="esl">English as Second Language</Label>
                      <Switch
                        id="esl"
                        checked={profile.isESL}
                        onCheckedChange={(checked) => updateProfile({ isESL: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visual Preferences
              </CardTitle>
              <CardDescription>
                Customize the visual appearance to suit your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                      value={profile.preferredFontSize}
                      onValueChange={(value) => updateProfile({ preferredFontSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra_large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorScheme">Color Scheme</Label>
                    <Select
                      value={profile.preferredColorScheme}
                      onValueChange={(value) => updateProfile({ preferredColorScheme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high_contrast">High Contrast</SelectItem>
                        <SelectItem value="dark_mode">Dark Mode</SelectItem>
                        <SelectItem value="light_mode">Light Mode</SelectItem>
                        <SelectItem value="colorblind_friendly">Colorblind Friendly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="highContrast">High Contrast Mode</Label>
                    <Switch
                      id="highContrast"
                      checked={profile.highContrast}
                      onCheckedChange={(checked) => updateProfile({ highContrast: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reducedMotion">Reduce Motion</Label>
                    <Switch
                      id="reducedMotion"
                      checked={profile.reducedMotion}
                      onCheckedChange={(checked) => updateProfile({ reducedMotion: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pacing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pacing & Timing Preferences
              </CardTitle>
              <CardDescription>
                Set your preferred learning pace and break schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pacing">Learning Pace</Label>
                  <Select
                    value={profile.preferredPacing}
                    onValueChange={(value) => updateProfile({ preferredPacing: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_slow">Very Slow</SelectItem>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="very_fast">Very Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakFrequency">Break Frequency (minutes)</Label>
                  <Input
                    id="breakFrequency"
                    type="number"
                    min="5"
                    max="60"
                    value={profile.breakFrequency}
                    onChange={(e) => updateProfile({ breakFrequency: parseInt(e.target.value) || 15 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSessionLength">Max Session Length (minutes)</Label>
                  <Input
                    id="maxSessionLength"
                    type="number"
                    min="15"
                    max="180"
                    value={profile.maxSessionLength}
                    onChange={(e) => updateProfile({ maxSessionLength: parseInt(e.target.value) || 45 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Content Preferences
              </CardTitle>
              <CardDescription>
                Customize how content is presented to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Language & Clarity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="simplifiedLanguage">Simplified Language</Label>
                      <Switch
                        id="simplifiedLanguage"
                        checked={profile.simplifiedLanguage}
                        onCheckedChange={(checked) => updateProfile({ simplifiedLanguage: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="extraExplanations">Extra Explanations</Label>
                      <Switch
                        id="extraExplanations"
                        checked={profile.extraExplanations}
                        onCheckedChange={(checked) => updateProfile({ extraExplanations: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Media & Support</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="visualAids">Visual Aids</Label>
                      <Switch
                        id="visualAids"
                        checked={profile.visualAids}
                        onCheckedChange={(checked) => updateProfile({ visualAids: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="audioSupport">Audio Support</Label>
                      <Switch
                        id="audioSupport"
                        checked={profile.audioSupport}
                        onCheckedChange={(checked) => updateProfile({ audioSupport: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cultural">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Cultural & Language Preferences
              </CardTitle>
              <CardDescription>
                Set your cultural context and language preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryLanguage">Primary Language</Label>
                    <Select
                      value={profile.primaryLanguage}
                      onValueChange={(value) => updateProfile({ primaryLanguage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="culturalContext">Cultural Context (Optional)</Label>
                    <Input
                      id="culturalContext"
                      placeholder="e.g., Middle Eastern, Asian, Western"
                      value={profile.culturalContext || ''}
                      onChange={(e) => updateProfile({ culturalContext: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="religiousConsiderations">Religious Considerations (Optional)</Label>
                    <Input
                      id="religiousConsiderations"
                      placeholder="e.g., Islamic, Christian, Secular"
                      value={profile.religiousConsiderations || ''}
                      onChange={(e) => updateProfile({ religiousConsiderations: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
