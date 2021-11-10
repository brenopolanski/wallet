import { ipcRenderer } from "electron";
import { PluginRawInstance } from "plugins/types";

export const search = (profileId: string): Promise<PluginRawInstance[]> =>
	ipcRenderer.invoke("plugin:loader-fs.search", profileId);
export const remove = (dir: string): Promise<PluginRawInstance[]> => ipcRenderer.invoke("plugin:loader-fs.remove", dir);
export const find = (dir: string): Promise<PluginRawInstance> => ipcRenderer.invoke("plugin:loader-fs.find", dir);
