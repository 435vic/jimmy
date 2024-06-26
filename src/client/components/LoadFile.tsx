import React, { useState, useEffect } from 'react';
import ViewFile from './ViewFile';
import zlib from 'pako';
// @ts-ignore
import untar from 'js-untar';
import { JimmyCompletionEvent } from '../../lib/context';
import { socket } from '../socket';

const LoadFile = () => {
  const [contextFiles, setContextFiles] = useState<{ name: string, data: Uint8Array }[] | null>(null);
  const [partialMsg, setPartialMsg] = useState<string>('');

  useEffect(() => {
    function onEvent(event: JimmyCompletionEvent) {
      if (event.type === 'partial') {
        setPartialMsg(partial => partial + event.content);
      }
    }
    
    socket.on('message', onEvent);

    return () => {
      socket.off('message', onEvent);
    }
  }, []);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }
  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = event.dataTransfer.files;

    if (files.length === 1 && files[0].name.endsWith('.tar.gz')) {
      const zipFile = files[0];

      if (zipFile.size <= 10 * 1024 * 1024) {
        try {
          const data = await zipFile.arrayBuffer();
          const pendingFiles = (await untar(zlib.inflate(data).buffer) as any[])
            .filter((f: any) => f.type === '0')
            .map(async (f: any) => ({
              name: f.name as string,
              data: new Uint8Array(await (f.blob as Blob).arrayBuffer())
            }));
          const files = await Promise.all(pendingFiles);
          setContextFiles(files);
          console.log(files);
          const formData = new FormData();
          formData.append('file', zipFile);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            console.log('Archivo .zip subido exitosamente');
          } else {
            console.error('Error al subir el archivo .zip:', response.statusText);
          }
        } catch (error) {
          console.error('Error al realizar la solicitud:', error);
        }
      } else {
        console.error('El archivo .zip excede el tamaño máximo permitido (10 MB)');
      }
    } else {
      console.error('El tipo de archivo debe ser un solo archivo .zip');
    }
  }

  return (
    <div className="content">
      {contextFiles !== null ? <ViewFile fileData={contextFiles} messages={[partialMsg]} /> : (
        <div className='background-load'>
          <div className="loadFile" onDragOver={handleDragOver} onDrop={handleDrop}>
            <div className="text">Arrastra tu zip aquí</div>
            <div className='box'>
              <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="currentColor" className="upload-icon" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
                <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default LoadFile