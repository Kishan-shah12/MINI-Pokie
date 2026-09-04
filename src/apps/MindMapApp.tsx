import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Download,
  Share2,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Link as LinkIcon,
  Shapes,
} from "lucide-react";

interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  shape: "rounded" | "rect" | "pill" | "diamond";
}

interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

const COLOR_OPTIONS = [
  { name: "Indigo", bg: "#4f46e5", border: "#6366f1" },
  { name: "Emerald", bg: "#059669", border: "#10b981" },
  { name: "Rose", bg: "#e11d48", border: "#f43f5e" },
  { name: "Amber", bg: "#d97706", border: "#f59e0b" },
  { name: "Cyan", bg: "#0891b2", border: "#06b6d4" },
  { name: "Purple", bg: "#9333ea", border: "#a855f7" },
];

export const MindMapApp: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: "root", x: 380, y: 180, text: "Central Idea / Project", color: "#4f46e5", shape: "pill" },
    { id: "n1", x: 180, y: 320, text: "Frontend Architecture", color: "#0891b2", shape: "rounded" },
    { id: "n2", x: 380, y: 340, text: "API & Data Services", color: "#059669", shape: "rounded" },
    { id: "n3", x: 580, y: 320, text: "Product Launch Strategy", color: "#d97706", shape: "rounded" },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: "e1", from: "root", to: "n1" },
    { id: "e2", from: "root", to: "n2" },
    { id: "e3", from: "root", to: "n3" },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Add new node
  const handleAddNode = () => {
    const id = "node_" + Date.now();
    const parentNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

    const newX = parentNode ? parentNode.x + Math.floor(Math.random() * 80 - 40) : 380;
    const newY = parentNode ? parentNode.y + 120 : 250;

    const newNode: Node = {
      id,
      x: newX,
      y: newY,
      text: "New Node",
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].bg,
      shape: "rounded",
    };

    setNodes((prev) => [...prev, newNode]);

    if (parentNode) {
      setEdges((prev) => [...prev, { id: "e_" + Date.now(), from: parentNode.id, to: id }]);
    }
    setSelectedNodeId(id);
  };

  // Delete Node & connected edges
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Drag Node Handlers
  const handleMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    if (connectingFromId) {
      if (connectingFromId !== node.id) {
        // Create link
        setEdges((prev) => [
          ...prev,
          { id: "e_" + Date.now(), from: connectingFromId, to: node.id },
        ]);
      }
      setConnectingFromId(null);
      return;
    }

    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      setDragOffset({
        x: e.clientX - svgRect.left - node.x,
        y: e.clientY - svgRect.top - node.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const newX = Math.max(40, Math.min(svgRect.width - 40, e.clientX - svgRect.left - dragOffset.x));
    const newY = Math.max(30, Math.min(svgRect.height - 30, e.clientY - svgRect.top - dragOffset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Export Diagram PNG
  const handleExportPNG = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = svg.clientWidth || 800;
    canvas.height = svg.clientHeight || 500;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "mindmap-diagram.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 select-none">
      {/* Top Banner Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Shapes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Mind Map & Diagram Canvas</h2>
            <p className="text-xs text-slate-400">Interactive Flowchart & Idea Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNode}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Node
          </button>

          <button
            onClick={() => setConnectingFromId(selectedNodeId || "root")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              connectingFromId
                ? "bg-amber-500 text-slate-950 font-bold animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{connectingFromId ? "Click Target Node..." : "Connect Link"}</span>
          </button>

          <button
            onClick={handleExportPNG}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export PNG
          </button>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div className="relative w-full h-[480px] bg-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden">
        <svg
          ref={svgRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => {
            setSelectedNodeId(null);
            setConnectingFromId(null);
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]"
        >
          {/* Render Curved Bezier Connection Lines */}
          {edges.map((edge) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const cx1 = fromNode.x + dx * 0.5;
            const cy1 = fromNode.y;
            const cx2 = fromNode.x + dx * 0.5;
            const cy2 = toNode.y;

            return (
              <g key={edge.id}>
                <path
                  d={`M ${fromNode.x} ${fromNode.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toNode.x} ${toNode.y}`}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={toNode.x} cy={toNode.y} r="3" fill="#94a3b8" />
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isConnectSource = connectingFromId === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleMouseDown(e, node)}
                className="cursor-pointer transition-transform group"
              >
                {/* Node Shape */}
                {node.shape === "pill" ? (
                  <rect
                    x="-90"
                    y="-22"
                    width="180"
                    height="44"
                    rx="22"
                    fill={node.color}
                    stroke={isSelected ? "#ffffff" : isConnectSource ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                    strokeWidth={isSelected || isConnectSource ? 3 : 1.5}
                    className="filter drop-shadow-lg"
                  />
                ) : (
                  <rect
                    x="-80"
                    y="-20"
                    width="160"
                    height="40"
                    rx="12"
                    fill={node.color}
                    stroke={isSelected ? "#ffffff" : isConnectSource ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                    strokeWidth={isSelected || isConnectSource ? 3 : 1.5}
                    className="filter drop-shadow-lg"
                  />
                )}

                {/* Node Text Label */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  className="pointer-events-none select-none"
                >
                  {node.text}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Editor Floating Bar */}
        {selectedNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-in fade-in">
            <input
              type="text"
              value={selectedNode.text}
              onChange={(e) => {
                const val = e.target.value;
                setNodes((prev) =>
                  prev.map((n) => (n.id === selectedNode.id ? { ...n, text: val } : n))
                );
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-400 w-44"
            />

            {/* Colors */}
            <div className="flex items-center gap-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  onClick={() =>
                    setNodes((prev) =>
                      prev.map((n) => (n.id === selectedNode.id ? { ...n, color: c.bg } : n))
                    )
                  }
                  className="w-5 h-5 rounded-full border border-white/20 transition active:scale-90"
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>

            <button
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition ml-1"
              title="Delete Node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Drag nodes to reposition. Click "Add Node" to spawn ideas, or "Connect Link" to draw relationship branches.
      </p>
    </div>
  );
};
