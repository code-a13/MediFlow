import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data, isConnectable }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-gray-200 min-w-[150px] text-center">
      
      {/* Input Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-500"
      />

      <div className="flex flex-col items-center">
        {data.icon && <span className="text-2xl mb-1">{data.icon}</span>}
        
        <strong className="text-sm font-bold text-gray-800">
          {data.label}
        </strong>
        
        {data.subline && (
          <span className="text-xs text-gray-500">
            {data.subline}
          </span>
        )}
      </div>

      {/* Output Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-500"
      />
    </div>
  );
};

export default memo(CustomNode);