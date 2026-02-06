import { PhotoLibraryProvider } from "@/backend/photo-library-context";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import PhotoEditor from "./pages/photo-editor";

function App() {
	return (
		<PhotoLibraryProvider>
			<Toaster />
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/gallery" element={<Gallery />} />
					<Route path="/edit" element={<PhotoEditor />} />
				</Routes>
			</BrowserRouter>
		</PhotoLibraryProvider>
	);
}

export default App;
