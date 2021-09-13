import { Contracts, Environment } from "@payvo/profiles";
import { useConfiguration } from "app/contexts";
import { useCallback, useEffect, useState } from "react";

export const useWelcomeModal = (environment: Environment, profile: Contracts.IProfile) => {
	const [show, setShow] = useState<boolean>(false);
	const [step, setStep] = useState<number>(1);
	const [showAgain, setShowAgain] = useState(true);
	const { profileIsSyncing } = useConfiguration();

	useEffect(() => {
		if (profileIsSyncing) {
			return;
		}

		setShow(!profile.hasCompletedIntroductoryTutorial());
	}, [profile, profileIsSyncing]);

	const onClose = useCallback(async () => {
		if (!showAgain || step === 5) {
			profile.markIntroductoryTutorialAsComplete();
		}

		setShow(false);

		await environment.persist();
	}, [environment, profile, showAgain, step]);

	const toggleShowAgain = () => {
		setShowAgain(!showAgain);
	};

	const goToNextStep = () => {
		setStep(step + 1);
	};

	const goToPreviousStep = () => {
		setStep(step - 1);
	};

	return {
		goToNextStep,
		goToPreviousStep,
		onClose,
		setStep,
		show,
		showAgain,
		step,
		toggleShowAgain,
	};
};
