import { GRAPH_COLORS } from "app/components/Graphs/Graphs.shared";

const getColor = (index: number): string => {
	if (GRAPH_COLORS[index]) {
		return GRAPH_COLORS[index];
	}

	return GRAPH_COLORS[GRAPH_COLORS.length - 1];
};

const formatPercentage = (value: number): string => `${Math.round(((value || 0) + Number.EPSILON) * 100) / 100}%`;

export { formatPercentage, getColor };
