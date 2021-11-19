import {
	GRAPH_COLOR_OTHER,
	GRAPH_COLOR_OTHER_DARK,
	GRAPH_COLORS,
	GRAPH_COLORS_DARK,
} from "app/components/Graphs/Graphs.contracts";

const getColor = (index: number, isDarkMode: boolean): string => {
	const colors = isDarkMode ? GRAPH_COLORS_DARK : GRAPH_COLORS;

	if (colors[index]) {
		return colors[index];
	}

	return colors[colors.length - 1];
};

const getOtherGroupColor = (isDarkMode: boolean): string => (isDarkMode ? GRAPH_COLOR_OTHER_DARK : GRAPH_COLOR_OTHER);

const formatPercentage = (value: number): string => `${Math.round(((value || 0) + Number.EPSILON) * 100) / 100}%`;

export { formatPercentage, getColor, getOtherGroupColor };
