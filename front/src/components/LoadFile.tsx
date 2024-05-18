import React from 'react';

function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
}
function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = event.dataTransfer.files;
  
}

const LoadFile: React.FC = () => {
    return (
        <div className="loadFile">
            <div className="box" onDragOver={handleDragOver} onDrop={handleDrop}>Drag your .zip file here</div>
        </div>
    )
};

export default LoadFile