import { DateTime } from "@payvo/sdk-intl";
import { useEnvironmentContext } from "app/contexts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Callback = () => Promise<void | any>;

interface Job {
	callback: Callback;
	interval: number;
}

interface JobError {
	timestamp: number;
	error: any;
}

export const useSynchronizer = (jobs: Job[]) => {
	const timers = useRef<number[]>([]);
	const { persist } = useEnvironmentContext();
	const [error, setError] = useState<JobError>();

	const run = useCallback(
		async (callback: Callback) => {
			try {
				await callback();
				await persist();
			} catch (error) {
				setError({ error, timestamp: DateTime.make().toUNIX() });
			}
		},
		[persist, setError],
	);

	const stop = useCallback((properties?: { clearTimers: boolean }) => {
		setError(undefined);

		for (const timer of timers.current) {
			clearInterval(timer);
		}

		if (properties?.clearTimers) {
			timers.current = [];
		}
	}, []);

	const start = useCallback(() => {
		stop(); // Stop previous jobs in progress
		for (const job of jobs) {
			timers.current.push(+setInterval(() => run(job.callback), job.interval));
		}
	}, [run, jobs, stop]);

	const runAll = useCallback(() => Promise.allSettled(jobs.map((job) => run(job.callback))), [run, jobs]);

	useEffect(() => {
		const current = timers.current;
		return () => {
			for (const timer of current) {
				clearInterval(timer);
			}
		};
	}, [timers]);

	return useMemo(
		() => ({ clearError: () => setError(undefined), error, runAll, start, stop }),
		[error, setError, start, stop, runAll],
	);
};
