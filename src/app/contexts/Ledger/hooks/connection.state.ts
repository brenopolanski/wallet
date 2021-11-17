import { LedgerModel } from "app/hooks";

import { Handlers, OfUnion } from "./reducer.contracts";

interface State {
	device?: {
		path: string;
		id: LedgerModel;
	};
	isConnected: boolean;
	isBusy: boolean;
	isWaiting: boolean;
	error?: any;
}

type Action =
	| { type: "add"; path: string; id: string }
	| { type: "remove" }
	| { type: "connected" }
	| { type: "busy" }
	| { type: "waiting" }
	| { type: "disconnected" }
	| { type: "failed"; message: string };

export const defaultConnectionState = { isBusy: false, isConnected: false, isWaiting: false };

export const connectionReducer = (state: State, action: Action): State => {
	const handlers: Handlers<OfUnion<Action>, State> = {
		add: ({ id, path }) => ({
			...state,
			device: {
				id: id as LedgerModel,
				path: path,
			},
		}),
		busy: () => ({
			...state,
			isBusy: true,
			isWaiting: false,
		}),
		connected: () => ({
			...state,
			isBusy: false,
			isConnected: true,
			isWaiting: false,
		}),
		disconnected: () => ({
			...state,
			isBusy: false,
			isConnected: false,
			isWaiting: false,
		}),
		failed: ({ message }) => ({
			...state,
			error: message,
			isBusy: false,
			isWaiting: false,
		}),
		remove: () => ({
			...state,
			device: undefined,
			isConnected: false,
		}),
		waiting: () => ({
			...state,
			error: undefined,
			isBusy: false,
			isWaiting: true,
		}),
	};

	return handlers[action.type](action as any);
};
