// InteractiveGraph.tsx — GeoGebra-backed
import { useEffect, useRef } from "react";

declare global {
  interface Window { GGBApplet?: any }
}

type Props = {
  graphExpression?: string;             // e.g. "f(x)=x^2"
  expressions?: string[];               // optional multiple
  title?: string;

  // Legacy support: points array (will be converted to GeoGebra commands)
  points?: Array<{ x: number; y: number }>;

  // viewport (only used to set initial view)
  xMin?: number; xMax?: number;
  yMin?: number; yMax?: number;
  height?: number;

  // GeoGebra app choice
  app?: "graphing" | "geometry" | "3d" | "cas";

  // Advanced: direct GeoGebra commands (run after load)
  ggbCommands?: string[];               // e.g. ["a=2", "f(x)=a*sin(x)"]
  showToolbar?: boolean;
  showAlgebraInput?: boolean;
  allowZoom?: boolean;
};

export default function InteractiveGraph({
  graphExpression = "f(x)=x",
  expressions,
  title,
  points,
  xMin = -10, xMax = 10,
  yMin = -10, yMax = 10,
  height = 420,
  app = "graphing",
  ggbCommands = [],
  showToolbar = true,
  showAlgebraInput = true,
  allowZoom = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appletRef = useRef<any>(null);
  const ggbRef = useRef<any>(null);

  // Convert JavaScript expression to GeoGebra syntax
  const convertToGeoGebraExpression = (expression: string): string => {
    if (!expression) return '';
    
    console.log('Converting expression:', expression);
    
    // Convert JavaScript syntax to GeoGebra syntax
    let ggbExpression = expression
      .replace(/\*/g, '') // Remove * for multiplication (GeoGebra uses implicit multiplication)
      .replace(/Math\.sin/g, 'sin')
      .replace(/Math\.cos/g, 'cos')
      .replace(/Math\.tan/g, 'tan')
      .replace(/Math\.sqrt/g, 'sqrt')
      .replace(/Math\.log/g, 'log')
      .replace(/Math\.exp/g, 'exp')
      .replace(/\^/g, '^'); // Keep ^ for exponentiation
    
    // If it doesn't start with f(x)= or y=, assume it's a function
    if (!ggbExpression.includes('=') && !ggbExpression.includes('f(')) {
      ggbExpression = `f(x) = ${ggbExpression}`;
    }
    
    console.log('Converted to:', ggbExpression);
    return ggbExpression;
  };

  // Convert points array to GeoGebra commands
  const convertPointsToCommands = (points: Array<{ x: number; y: number }>): string[] => {
    if (!points || points.length === 0) return [];
    
    const commands: string[] = [];
    
    // Create individual points
    points.forEach((point, index) => {
      commands.push(`P${index + 1} = (${point.x}, ${point.y})`);
    });
    
    // If we have multiple points, create a polygon or line
    if (points.length > 1) {
      const pointNames = points.map((_, index) => `P${index + 1}`).join(', ');
      if (points.length === 2) {
        commands.push(`line = Line(${pointNames})`);
      } else {
        commands.push(`polygon = Polygon(${pointNames})`);
      }
    }
    
    return commands;
  };

  // create / re-create applet when app or container changes
  useEffect(() => {
    console.log('InteractiveGraph useEffect triggered');
    console.log('Container ref:', !!containerRef.current);
    console.log('GGBApplet available:', !!window.GGBApplet);
    
    if (!containerRef.current) {
      console.log('No container ref available');
      return;
    }
    
    if (!window.GGBApplet) {
      console.log('GGBApplet not available, waiting...');
      return;
    }

    // destroy previous
    if (appletRef.current && appletRef.current.remove) {
      try { appletRef.current.remove(); } catch {}
      appletRef.current = null;
      ggbRef.current = null;
    }

    // base config (see official API)
    const params = {
      appName: app,                         // "graphing" | "geometry" | "3d" | "cas"
      width: containerRef.current.clientWidth || 800,
      height,
      showToolBar: showToolbar,
      showAlgebraInput,
      showMenuBar: true,                    // Enable menu bar for settings
      showResetIcon: true,                  // Enable reset icon
      enableRightClick: true,               // Enable right-click context menu
      enableLabelDrags: true,               // Enable label dragging
      allowStyleBar: true,                  // Enable style bar
      allowUpscale: true,
      allowZoom,
      perspective: undefined,               // let app choose sensible default
      useBrowserForJS: true,                // allow JS API from page
      // pre-load material (none; we'll inject commands below)
    };

    // mount
    const applet = new window.GGBApplet(params, /* useBrowserForJS */ true);
    applet.inject(containerRef.current);
    appletRef.current = applet;

    // wait until API is ready
    const onLoad = () => {
      console.log('GeoGebra applet onLoad called');
      // store API handle
      ggbRef.current = applet.getAppletObject();
      console.log('GGB API handle:', !!ggbRef.current);

      // set axes range (graphing & 3D apps honor this via SetCoordSystem)
      try {
        // 2D view id=1
        ggbRef.current.setCoordSystem(xMin, xMax, yMin, yMax);
      } catch {}

      // title as a text object (optional)
      if (title) {
        try {
          ggbRef.current.evalCommand(`Text("${title}", (${xMin}+${xMax})/2, ${yMax} - 0.5)`);
        } catch {}
      }

      // primary expression(s)
      const list = (expressions && expressions.length > 0) ? expressions : [graphExpression];
      console.log('Original expressions:', list);
      
      // Convert expressions to GeoGebra syntax
      const convertedList = list.map(expr => convertToGeoGebraExpression(expr));
      console.log('Converted expressions:', convertedList);
      
      convertedList.forEach((cmd, index) => {
        if (cmd) {
          console.log('Executing command:', cmd);
          try {
            ggbRef.current.evalCommand(cmd);
            console.log('Command executed successfully');
          } catch (error) {
            console.error('Error executing converted command:', cmd, error);
            // Try original expression as fallback
            const originalCmd = list[index];
            if (originalCmd && originalCmd !== cmd) {
              console.log('Trying original expression as fallback:', originalCmd);
              try {
                ggbRef.current.evalCommand(originalCmd);
                console.log('Original command executed successfully');
              } catch (fallbackError) {
                console.error('Fallback command also failed:', originalCmd, fallbackError);
              }
            }
          }
        }
      });

      // convert points to GeoGebra commands (legacy support)
      if (points && points.length > 0) {
        const pointsCommands = convertPointsToCommands(points);
        pointsCommands.forEach((cmd) => ggbRef.current.evalCommand(cmd));
      }

      // extra scripted commands (sliders, points, derivatives, etc.)
      ggbCommands.forEach((cmd) => ggbRef.current.evalCommand(cmd));

      // example: listen for object updates (teacher analytics later)
      try {
        ggbRef.current.registerUpdateListener((name: string) => {
          console.log("Updated:", name, ggbRef.current.getValueString(name));
          // e.g., capture point movement or slider changes
          // console.log("Updated:", name, ggbRef.current.getValueString(name));
        });
      } catch {}
    };

    // GeoGebra calls this when ready
    (window as any).ggbOnInit = onLoad;

    return () => {
      if (appletRef.current && appletRef.current.remove) {
        try { appletRef.current.remove(); } catch {}
      }
      appletRef.current = null;
      ggbRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, height]);

  // update expressions / view when props change at runtime
  useEffect(() => {
    const api = ggbRef.current;
    if (!api) return;

    try { api.setCoordSystem(xMin, xMax, yMin, yMax); } catch {}

    // clear previous functions (optional: refine to only replace known ids)
    try { api.reset(); } catch {}

    const list = (expressions && expressions.length > 0) ? expressions : [graphExpression];
    const convertedList = list.map(expr => convertToGeoGebraExpression(expr));
    convertedList.forEach((cmd) => {
      if (cmd) {
        api.evalCommand(cmd);
      }
    });
    
    // convert points to GeoGebra commands (legacy support)
    if (points && points.length > 0) {
      const pointsCommands = convertPointsToCommands(points);
      pointsCommands.forEach((cmd) => api.evalCommand(cmd));
    }
    
    ggbCommands.forEach((cmd) => api.evalCommand(cmd));
    // title
    if (title) { try { api.evalCommand(`Text("${title}", (${xMin}+${xMax})/2, ${yMax} - 0.5)`); } catch {} }
}, [
  graphExpression,
  expressions, // Added missing dependency
  points,      // Added missing dependency
  ggbCommands, // Added missing dependency
  xMin,
  xMax,
  yMin,
  yMax,
  title
]);
  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
