const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    test: test => ipcRenderer.send("test", test)
});