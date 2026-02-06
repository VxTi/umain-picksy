import EditingSettingsBar from "./EditingSettingsBar";
import { PhotoComponent } from "./PhotoComponent";

export default function EditingScreen() {
    return(
        <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
            <div style={{
                width: "70%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
            }}>
                <PhotoComponent src="/logo.png" alt="/logo.png" />
            </div>

            <div style={{ width: "30%", overflow: "auto" }}>
                <EditingSettingsBar />
            </div>
        </div>
    );
};