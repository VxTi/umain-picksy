import reactLogo from "../assets/react.svg";
import { analyzeImageMetadata, selectSourceFolder } from '../lib/vision';
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PicksyView from "../PicksyView";

function Home() {
  async function test() {
    const result = await selectSourceFolder();
    if (result && result.length > 0) {
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

export default Home;
