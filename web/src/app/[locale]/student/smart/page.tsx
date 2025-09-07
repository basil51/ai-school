"use client";
import React, { useMemo, useState } from 'react';
import SmartLearningCanvas from '@/components/SmartLearningCanvas';

type ContentType = 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | '3d' | 'advanced-3d' | 'd3-advanced';

export default function Page() {
  const [contentType, setContentType] = useState<ContentType>('math');
  const [learningStyle, setLearningStyle] = useState<'visual' | 'audio' | 'kinesthetic' | 'analytical'>('visual');

  const content = useMemo(() => {
    switch (contentType) {
      case 'math':
        return {
          equation: String('\\int_0^{\\pi} \\sin(x)\\,dx = 2'),
          explanation: 'The integral of sin(x) from 0 to π equals 2. This follows from the antiderivative −cos(x) evaluated at the bounds.',
          graphExpression: 'Math.sin(x)',
          graphTitle: 'y = sin(x) on [-10, 10]',
          narration: 'Let us understand the area under the sine curve from zero to pi. The positive lobe integrates to two.'
        };
      case 'diagram':
        return {
          title: 'Photosynthesis Overview',
          chart: `graph TD\n  A[Sunlight] --> B[Chlorophyll]\n  B --> C[Light Reactions]\n  C --> D[ATP + NADPH]\n  D --> E[Calvin Cycle]\n  E --> F[Glucose]`,
          theme: 'neutral',
          narration: 'This diagram illustrates the flow of energy in photosynthesis from sunlight to glucose.'
        };
      case 'simulation':
        return {
          title: 'Projectile Motion',
          g: 9.81,
          initialSpeed: 22,
          angleDeg: 45,
          narration: 'Adjust speed and angle to see how range and height change in projectile motion.'
        };
      case 'video':
        return {
          title: 'Short Concept Video',
          src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          poster: '/vercel.svg',
          captions: undefined,
          narration: 'Watch a short video, then we will summarize the key points.'
        };
      case 'interactive':
        return {
          title: 'Explore the Code and Visualization',
          initialCode: "const arr = [1,2,3,4];\nconsole.log('Sum:', arr.reduce((a,b)=>a+b,0));",
          graphExpression: '0.2 * (x*x - 10*x + 16)',
          narration: 'Experiment with the code playground and observe the plotted function on the right.'
        };
      case '3d':
        return {
          title: '3D Geometry Visualization',
          visualizationType: 'geometry',
          config: {
            geometry: {
              shape: 'sphere',
              color: '#3b82f6',
              wireframe: false
            }
          },
          narration: 'Explore 3D geometric shapes with Three.js. Rotate and interact with the visualization.'
        };
      case 'advanced-3d':
        return {
          title: 'Advanced 3D Physics Engine',
          visualizationType: 'physics-engine',
          config: {
            scene: {
              backgroundColor: '#f8fafc',
              gravity: true
            },
            physics: {
              enabled: true,
              gravity: -9.81
            }
          },
          narration: 'Experience advanced 3D physics simulations with Babylon.js engine.'
        };
      case 'd3-advanced':
        return {
          title: 'Advanced Data Visualization',
          visualizationType: 'network',
          config: {
            network: {
              nodes: 25,
              links: 40
            }
          },
          narration: 'Explore complex data relationships with advanced D3.js visualizations.'
        };
      default:
        return {
          title: 'Welcome to Smart Learning Canvas',
          text: 'Choose a modality above to experience multi-modal learning content.'
        };
    }
  }, [contentType]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Smart Learning Canvas — Demo</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Learning style:</label>
          <select
            value={learningStyle}
            onChange={(e) => setLearningStyle(e.target.value as any)}
            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
          >
            <option value="visual">Visual</option>
            <option value="audio">Audio</option>
            <option value="kinesthetic">Kinesthetic</option>
            <option value="analytical">Analytical</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['text','math','diagram','simulation','video','interactive','3d','advanced-3d','d3-advanced'] as ContentType[]).map((t) => (
          <button
            key={t}
            onClick={() => setContentType(t)}
            className={`px-3 py-1 rounded-md text-sm border ${contentType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <SmartLearningCanvas content={content} contentType={contentType} learningStyle={learningStyle} />

      <div className="text-sm text-gray-600">
        Tip: Try different modalities and enable audio narration on math/diagram/simulation content.
      </div>
    </div>
  );
}


