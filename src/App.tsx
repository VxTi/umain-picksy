import { analyzeImageMetadata, selectSourceFolder } from './lib/vision';
import "./App.css";
import PicksyView from "./PicksyView";

function App() {
  async function test() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    const result = await selectSourceFolder();
    if (result && result.length > 0) {
      // Example: analyze metadata of the first image
      const metadata = await Promise.all(result.map(r => analyzeImageMetadata(r)));
      console.log(metadata);
    }
  }

  return (
    <main className="container">
      <PicksyView/>
    </main>
  );
}

export default App;
