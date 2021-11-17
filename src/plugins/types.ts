import { Http, Services } from "@payvo/sdk";
import { Repositories } from "@payvo/sdk-profiles";
import { HttpClient } from "app/services/HttpClient";

import { PluginManager } from "./core";

export type WithPluginManager<T> = T & { manager: PluginManager };

export interface PluginAPI {
	launch(): {
		render(children: React.ReactNode): void;
	};
	http(): {
		create: () => HttpClient;
		decorate: (key: string, callback: <T = any>(argument: T) => T) => void;
		get: (url: string, query?: object) => Promise<Http.HttpResponse>;
		post: (url: string, data?: object) => Promise<Http.HttpResponse>;
	};
	filesystem(): {
		askUserToSaveFile(content: string, suggestedFileName?: string): Promise<void>;
		askUserToOpenFile(): Promise<string | undefined>;
	};
	events(): {
		on: (channel: string, callback: () => void) => void;
	};
	profile(): {
		wallets: () => Record<string, any>[];
	};
	store(): {
		data: () => Repositories.DataRepository;
		persist: () => void;
	};
	theme(): {
		decorate: <T = any>(key: string, callback: (Component: T, properties: Record<string, any>) => T) => void;
	};
	timers(): {
		clearInterval: (handle: number) => void;
		clearTimeout: (handle: number) => void;
		setInterval: (handler: Function, timeout: number) => number;
		setTimeout: (handler: Function, timeout: number) => number;
	};
	message(): {
		useSignMessageModal: (parameters: {
			message: string;
			walletId: string;
		}) => [
			React.FunctionComponent,
			Services.SignedMessage | undefined,
			{ isOpen: boolean; open: () => void; close: () => void },
		];
	};
}

export interface PluginRawInstance {
	config: Record<string, any>;
	sourcePath: string;
	source: string;
	dir: string;
}

export enum PluginServiceIdentifier {
	Events = "EVENTS",
	FileSystem = "FILESYSTEM",
	HTTP = "HTTP",
	Launch = "LAUNCH",
	Profile = "PROFILE",
	Store = "STORE",
	Theme = "THEME",
	Timers = "TIMERS",
	Message = "MESSAGE",
}

export interface PluginServiceConfig {
	id: string;
	accessor: string;
}

export interface PluginUpdateStatus {
	isAvailable?: boolean;
	isCompatible?: boolean;
	minimumVersion?: string;
}

export interface SerializedPluginConfigurationData {
	archiveUrl?: string;
	author: string;
	categories: string[];
	category: string;
	date?: string;
	description?: string;
	homepage?: string;
	id: string;
	images: string[];
	isCompatible: boolean;
	isOfficial: boolean;
	logo?: string;
	minimumVersion?: string;
	name: string;
	permissions: string[];
	size: string;
	title?: string;
	url?: string;
	version: string;
	percent?: number;
}

export type ExtendedSerializedPluginConfigurationData = {
	hasLaunch: boolean;
	isEnabled: boolean;
	isInstalled: boolean;
	updateStatus: PluginUpdateStatus;
} & SerializedPluginConfigurationData;
