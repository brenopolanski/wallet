import { useQueryParams } from "app/hooks";
import { FilterOption } from "domains/vote/components/VotesFilter";
import { getParameters } from "domains/vote/utils/url-parameters";
import { useMemo } from "react";

export const useVoteQueryParameters = () => {
	const queryParameters = useQueryParams();
	const unvoteDelegates = getParameters(queryParameters, "unvote");
	const voteDelegates = getParameters(queryParameters, "vote");
	const filter = (queryParameters.get("filter") || "all") as FilterOption;

	return useMemo(() => ({ filter, unvoteDelegates, voteDelegates }), [filter, unvoteDelegates, voteDelegates]);
};
