import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { analyzeImageMetadata, selectSourceFolder } from './lib/vision';
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function test() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    const result = await selectSourceFolder();
    if (result && result.length > 0) {
      console.log(result);
      // Example: analyze metadata of the first image
      const metadata = await analyzeImageMetadata(result[0]);
      setGreetMsg(`Selected ${result.length} images. First taken at: ${metadata.datetime ?? 'unknown time'}`);
    } else if (result) {
      setGreetMsg("Selected 0 images");
    }
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          test();
        }}
      >
        <button type="submit">Select Library</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
