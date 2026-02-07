import { PhotoLibraryProvider } from "@/backend/photo-library-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLocation } from "@/lib/app-locations";
import ImageGallery from "@/pages/image-gallery/screen";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import PhotoEditor from "./pages/photo-editor/screen";

function App() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="picksy-ui-theme">
			<PhotoLibraryProvider>
				<TooltipProvider delayDuration={0}>
					<Toaster />
					<BrowserRouter>
						<Routes>
							<Route path={AppLocation.HOME} element={<ImageGallery />} />
							<Route path={AppLocation.EDITOR} element={<PhotoEditor />} />
						</Routes>
					</BrowserRouter>
				</TooltipProvider>
			</PhotoLibraryProvider>
		</ThemeProvider>
	);
}

export default App;
