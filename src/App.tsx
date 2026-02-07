import { PhotoLibraryProvider } from "@/backend/photo-library-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";
import Home from "./pages/home";
import ImageGallery from "./pages/image-gallery";
import PhotoEditor from "./pages/photo-editor";

function App() {
	return (
		<PhotoLibraryProvider>
			<TooltipProvider delayDuration={0}>
				<DndProvider backend={HTML5Backend}>
					<Toaster />
					<BrowserRouter>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/gallery" element={<ImageGallery />} />
							<Route path="/edit" element={<PhotoEditor />} />
						</Routes>
					</BrowserRouter>
				</DndProvider>
			</TooltipProvider>
		</PhotoLibraryProvider>
	);
}

export default App;
