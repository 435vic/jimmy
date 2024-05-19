
import './App.css'
import LoadFile from './components/LoadFile';
import ViewFile from './components/ViewFile';

function App() {

  return (
    <>
      <div className='page'>
        <div className='header'>
          <div className='title'>Jimmy</div>
          <div className='subtitle'>Tu debugger de confianza</div>
        </div>
        <ViewFile/>
      </div>
    </>
  )
}

export default App
