const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('photoDesktop',{
 status:()=>ipcRenderer.invoke('studio:status'),login:()=>ipcRenderer.invoke('studio:login'),
 setKey:key=>ipcRenderer.invoke('studio:set-key',key),clearKey:()=>ipcRenderer.invoke('studio:clear-key'),
 release:deviceId=>ipcRenderer.invoke('studio:release',deviceId),logout:()=>ipcRenderer.invoke('studio:logout'),
 edit:payload=>ipcRenderer.invoke('studio:edit',payload),cancel:id=>ipcRenderer.invoke('studio:cancel',id),
 openChatGPT:()=>ipcRenderer.invoke('studio:chatgpt')
});
