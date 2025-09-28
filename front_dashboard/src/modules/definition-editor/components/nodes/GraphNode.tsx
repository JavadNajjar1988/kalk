// کامپوننت GraphNode

import React, { useState } from 'react';
import { GraphNode as GraphNodeType } from '../../types';
import './GraphNode.css';

interface GraphNodeProps {
  node: GraphNodeType;
  isSelected: boolean;
  isHighlighted: boolean;
  isHovered?: boolean;
  onClick?: (node: GraphNodeType) => void;
  onDoubleClick?: (node: GraphNodeType) => void;
  onRightClick?: (node: GraphNodeType, event: React.MouseEvent) => void;
  onDragStart?: (node: GraphNodeType, event: React.DragEvent) => void;
  onDragEnd?: (node: GraphNodeType, event: React.DragEvent) => void;
  onHover?: (node: GraphNodeType) => void;
  onUnhover?: (node: GraphNodeType) => void;
  onDelete?: (node: GraphNodeType) => void;
  onHighlight?: (node: GraphNodeType) => void;
  onUnhighlight?: (node: GraphNodeType) => void;
  renderNodeContent?: (node: GraphNodeType) => React.ReactNode;
  className?: string;
}

const GraphNode: React.FC<GraphNodeProps> = ({
  node,
  isSelected,
  isHighlighted,
  onClick,
  onDoubleClick,
  onRightClick,
  onDragStart,
  onDragEnd,
  onHighlight,
  onUnhighlight,
  renderNodeContent,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { onHover, onUnhover } = { onHover: (undefined as any), onUnhover: (undefined as any) } as any;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(node);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRightClick?.(node, e);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart?.(node, e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragEnd?.(node, e);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (typeof onHover === 'function') onHover(node);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (typeof onUnhover === 'function') onUnhover(node);
  };

  const style: React.CSSProperties = {
    left: node.position?.x || 0,
    top: node.position?.y || 0,
    width: node.style?.width || 120,
    height: node.style?.height || 60,
    backgroundColor: node.style?.backgroundColor || '#3B82F6',
    borderColor: node.style?.borderColor || '#374151',
    borderWidth: node.style?.borderWidth || 2,
    borderRadius: node.style?.borderRadius || 8,
    fontSize: node.style?.fontSize || 14,
    color: node.style?.fontColor || '#ffffff',
    fontWeight: node.style?.fontWeight || '600',
    padding: node.style?.padding || 8,
    transform: `translate(-50%, -50%)`
  };

  return (
    <div
      className={`graph-node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isHovered ? 'hovered' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={true}
      title={node.label}
      onFocus={() => onHighlight?.(node)}
      onBlur={() => onUnhighlight?.(node)}
    >
      <div className="graph-node-content">
        {node.style?.icon && (
          <div className="graph-node-icon">
            {node.style.icon}
          </div>
        )}
        
        <div className="graph-node-label">
          {renderNodeContent ? renderNodeContent(node) : node.label}
        </div>
        
        {node.data?.children && node.data.children.length > 0 && (
          <div className="graph-node-children-count">
            {node.data.children.length}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div className="graph-node-tooltip">
          <div className="tooltip-content">
            <div className="tooltip-title">{node.label}</div>
            {node.data.description && (
              <div className="tooltip-description">{node.data.description}</div>
            )}
            <div className="tooltip-meta">
              <span>سطح: {node.data.level}</span>
              {node.data.children && node.data.children.length > 0 && (
                <span>فرزندان: {node.data.children.length}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphNode;
