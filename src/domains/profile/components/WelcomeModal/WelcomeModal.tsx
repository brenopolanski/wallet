/* eslint-disable max-lines-per-function */
import { Contracts, Environment } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Checkbox } from "app/components/Checkbox";
import { DotNavigation } from "app/components/DotNavigation";
import { Image } from "app/components/Image";
import { Modal } from "app/components/Modal";
import { useWelcomeModal } from "domains/profile/hooks/use-welcome-modal";
import React from "react";
import { useTranslation } from "react-i18next";

import { WelcomeModalStep } from "./WelcomeModal.models";

const Banner = ({ step }: { step: WelcomeModalStep }) => {
	if (step >= WelcomeModalStep.StepFirst) {
		return (
			<div className="-mx-10 my-8 border-t border-b border-theme-secondary-300 dark:border-theme-secondary-800">
				<Image name={`WelcomeModalStep${step - 1}`} domain="profile" className="w-full h-auto" />
			</div>
		);
	}

	return <Image name="WelcomeModalBanner" domain="profile" className="my-8" />;
};

export const WelcomeModal = ({ environment, profile }: { environment: Environment; profile: Contracts.IProfile }) => {
	const { t } = useTranslation();

	const { show, showAgain, toggleShowAgain, onClose, goToNextStep, setStep, goToPreviousStep, step } =
		useWelcomeModal(environment, profile);

	return (
		<Modal
			title={t(`PROFILE.MODAL_WELCOME.STEP_${step}_TITLE`)}
			image={<Banner step={step} />}
			isOpen={show}
			onClose={onClose}
		>
			<div className="container space-y-8">
				<div className="text-base leading-7 text-theme-secondary-text">
					<p>{t(`PROFILE.MODAL_WELCOME.STEP_${step}_DESCRIPTION`)}</p>
				</div>

				<div className="flex justify-between space-x-3 items-center">
					{step === WelcomeModalStep.Introduction ? (
						<label className="inline-flex items-center space-x-3 cursor-pointer dark:text-theme-secondary-700 text-theme-secondary-500 text-sm">
							<Checkbox checked={!showAgain} onChange={toggleShowAgain} />
							<span>{t("PROFILE.MODAL_WELCOME.DONT_SHOW_CHECKBOX_LABEL")}</span>
						</label>
					) : (
						<DotNavigation
							size={WelcomeModalStep.StepLast - 1}
							activeIndex={step - 2}
							onClick={(step: WelcomeModalStep) => setStep(step + 2)}
						/>
					)}

					<div className="flex space-x-3">
						{step === WelcomeModalStep.Introduction ? (
							<>
								<Button variant="secondary" onClick={onClose} data-testid="WelcomeModal-skip">
									{t("COMMON.SKIP")}
								</Button>

								<Button onClick={goToNextStep} data-testid="WelcomeModal-next">
									{t("COMMON.START")}
								</Button>
							</>
						) : (
							<>
								<Button variant="secondary" onClick={goToPreviousStep} data-testid="WelcomeModal-prev">
									{t("COMMON.PREV")}
								</Button>

								{step < WelcomeModalStep.StepLast ? (
									<Button onClick={goToNextStep} data-testid="WelcomeModal-next">
										{t("COMMON.NEXT")}
									</Button>
								) : (
									<Button onClick={onClose} data-testid="WelcomeModal-finish">
										{t("COMMON.FINISH")}
									</Button>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
};
