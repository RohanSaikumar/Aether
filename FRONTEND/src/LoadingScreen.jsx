import "./LoadingScreen.css";

export default function LoadingScreen() {
    return (
        <div className="loadingScreen">

            <div className="loadingLogo">
                <i className="fa-solid fa-layer-group"></i>
            </div>

            <h1>Aether</h1>

            <p>Preparing your workspace...</p>

            <div className="loadingBar">
                <div className="loadingBarProgress"></div>
            </div>

        </div>
    );
}