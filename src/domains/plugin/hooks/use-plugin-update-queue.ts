/* eslint-disable arrow-body-style */
import { Contracts } from "@payvo/sdk-profiles";
import { usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import { useCallback, useEffect, useRef, useState } from "react";

export const usePluginUpdateQueue = (profile: Contracts.IProfile) => {
	const [queue, setQueue] = useState<any[]>([]);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isUpdateCompleted, setIsUpdateCompleted] = useState(false);
	const { updatePlugin } = usePluginManagerContext();
	const initialQueueReference = useRef<string[]>([]);

	const currentPlugin = queue[0];

	const profileId = profile.id();

	const startUpdate = (plugins: any[]) => {
		const ids = plugins.map((plugin) => plugin.id);
		initialQueueReference.current = ids;

		setQueue(plugins);
		setIsUpdating(true);
		setIsUpdateCompleted(false);
	};

	const next = () => {
		setQueue((current) => current.slice(1));
	};

	const update = useCallback(async () => {
		await updatePlugin(currentPlugin, profileId);
		setTimeout(() => next(), 0);
	}, [currentPlugin, profileId]); // eslint-disable-line react-hooks/exhaustive-deps

	const hasUpdateComplete = (id: string) => {
		return initialQueueReference.current.includes(id) && !hasInUpdateQueue(id);
	};

	const hasInUpdateQueue = (id: string) => {
		return !!queue.find((plugin) => plugin.id === id);
	};

	useEffect(() => {
		if (!isUpdating) {
			return;
		}

		if (queue.length === 0) {
			setIsUpdating(false);
			setIsUpdateCompleted(true);
			return;
		}

		update();
	}, [isUpdating, queue, update]);

	return {
		hasInUpdateQueue,
		hasUpdateComplete,
		isUpdateCompleted,
		isUpdating,
		startUpdate,
	};
};
