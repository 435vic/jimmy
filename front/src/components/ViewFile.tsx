import React from "react"

interface ViewFileProps {
    fileData: any;
}

const ViewFile: React.FC<ViewFileProps> = ({ fileData }) => {
    return (
        <div className="view">
            <div className="view-box"></div>
            <div className="file-view">
                <pre>{JSON.stringify(fileData, null, 2)}</pre>
            </div>
            <div className="debug"></div>
        </div>
    )
};

export default ViewFile