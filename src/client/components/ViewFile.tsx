import React, { useState } from "react";
import JSZip from "jszip";

interface ViewFileProps {
    fileData: JSZip.JSZipObject[] | null;
}

const ViewFile = ({ fileData }: ViewFileProps) => {
    const [inputValue, setInputValue] = useState("");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };
    const handleSendClick = async () => {
        try {
            const response = await fetch('/api/load', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: inputValue })
            });

            if (response.ok) {
                // En caso de éxito
                console.log('Datos enviados exitosamente');
            } else {
                console.error('Error al enviar los datos:', response.statusText);
            }
        } catch (error) {
            console.error('Error al realizar la solicitud:', error);
        }
    };

    return (
        <div className="view">
            <div className="view-box">
                {fileData?.map(f => <div className="file-path">
                    <span>{f.name}</span><br/>
                </div>)}
            </div>
            <div className="file-view">
                <div className="chat"></div>
                <div className="input-box">
                    <input className="input" type="text" value={inputValue} onChange={handleInputChange}></input>
                    <div className="send" onClick={handleSendClick}></div>
                </div>
            </div>
        </div>
    )
};

export default ViewFile