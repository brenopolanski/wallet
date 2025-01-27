import { LedgerData } from "app/contexts/Ledger/contracts";

import { Handlers, OfUnion } from "./reducer.contracts";

interface State {
	error?: string;
	selected: string[];
	wallets: LedgerData[];
}

type Action =
	| { type: "success"; payload: LedgerData[] }
	| { type: "failed"; error: string }
	| { type: "toggleSelect"; path: string }
	| { type: "toggleSelectAll" };

const pathMapper = (item: LedgerData) => item.path;

export const scannerReducer = (state: State, action: Action): State => {
	const handlers: Handlers<OfUnion<Action>, State> = {
		failed: ({ error }) => ({
			...state,
			error: error,
		}),
		success: ({ payload }) => ({
			...state,
			error: undefined,
			selected: payload.map(pathMapper),
			wallets: payload,
		}),
		toggleSelect: ({ path }) => {
			const current = state.selected;
			const indexOf = state.selected.indexOf(path);

			if (indexOf >= 0) {
				current.splice(indexOf, 1);
			} else {
				current.push(path);
			}

			return { ...state, selected: [...current] };
		},
		toggleSelectAll: () => {
			const { selected, wallets } = state;

			if (selected.length === 0 || wallets.length > selected.length) {
				return { ...state, selected: wallets.map(pathMapper) };
			}

			return { ...state, selected: [] };
		},
	};

	return handlers[action.type](action as any);
};
