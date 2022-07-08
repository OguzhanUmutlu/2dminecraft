const electron = require("electron");
const {app, BrowserWindow, globalShortcut, ipcMain} = electron;
const path = require("path");
global.OS = {win32: "windows", darwin: "macOS"}[process.platform] || "linux";
global.MINECRAFT_PATH = app.getPath("userData");
global.DESKTOP_PATH = require("path").join(require("os").homedir(), "Desktop");
global.HOMEDIR = require("os").homedir();

const create_window = async () => {
    global.browser = new BrowserWindow({show: false, webPreferences: {preload: path.join(__dirname,"js", "preload.js")}});
    browser.setIcon("./src/assets/favicon.ico");
    browser.setMenu(null);
    browser.setTitle("Minecraft 2D");
    ipcMain.on("test", (event, ...args) => {
        const webContents = event.sender;
        const win = BrowserWindow.fromWebContents(webContents);

    });
    await browser.loadFile("./src/index.html");
    browser.maximize();
};
app.whenReady().then(async () => {
    globalShortcut.register("F5", console.info);
    globalShortcut.unregister("F5")
    globalShortcut.register("CommandOrControl+R", () => browser.reload());
    globalShortcut.register("CommandOrControl+D", () => browser.webContents.toggleDevTools());
    await create_window();
    app.on("activate", () => BrowserWindow.getAllWindows().length === 0 ? create_window() : null);
});
app.on("window-all-closed", () => process.platform !== "darwin" ? app.quit() : null);