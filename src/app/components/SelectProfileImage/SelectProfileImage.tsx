import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { useFiles } from "app/hooks/use-files";
import { toasts } from "app/services";
import cn from "classnames";
import { fromBuffer } from "file-type";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import tw, { styled } from "twin.macro";

interface SelectProfileImageProperties {
	className?: string;
	value?: string;
	name?: string;
	showLabel?: boolean;
	onSelect: (raw: string) => void;
}

const UploadButtonWrapper = styled.div`
	${tw`h-full w-full`}

	button {
		${tw`h-full w-full`}
		${tw`focus:ring-0!`}

		&:not(:focus):hover:enabled {
			${tw`bg-theme-secondary-900 dark:bg-theme-secondary-600 opacity-85`};
		}
	}
`;

const ProfileImageStyled = styled.div`
	& {
		${tw`relative inline-flex items-center justify-center rounded-md overflow-hidden cursor-pointer h-full`};
		${tw`focus-within:(ring-2 ring-theme-primary-400)`};
	}

	&:after {
		content: "";
		box-shadow: 0 0 0 25px rgba(0, 0, 0, 0.4);
		${tw`absolute inset-1 rounded-full`};
	}

	&:hover .upload-button-overlay {
		${tw`opacity-100`};
	}
`;

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "bmp"];

export const SelectProfileImage = ({
	className,
	value,
	name,
	showLabel = true,
	onSelect,
}: SelectProfileImageProperties) => {
	const { t } = useTranslation();
	const { openFile } = useFiles();

	const handleUploadImage = async () => {
		const file = await openFile({
			extensions: ALLOWED_EXTENSIONS,
		});

		if (!file) {
			return;
		}

		const type = await fromBuffer(file.content);

		if (!type?.ext || !ALLOWED_EXTENSIONS.includes(type.ext)) {
			toasts.error(t("COMMON.ERRORS.INVALID_IMAGE"));
			return;
		}

		const imageBase64 = file.content.toString("base64");
		onSelect(`data:image/png;base64,${imageBase64}`);
	};

	const isSvg = useMemo(() => value?.endsWith("</svg>"), [value]);

	const renderButton = () => {
		if (value) {
			return (
				<div className="relative w-20 h-20">
					<ProfileImageStyled>
						<img
							data-testid={`SelectProfileImage__avatar-${isSvg ? "identicon" : "image"}`}
							src={isSvg ? `data:image/svg+xml;utf8,${value}` : value}
							className="object-cover min-h-full"
							alt="Avatar"
						/>

						{isSvg && (
							<span className="absolute text-2xl font-semibold text-theme-background">
								{name?.slice(0, 2).toUpperCase()}
							</span>
						)}

						<button
							type="button"
							className="overflow-hidden absolute z-10 p-1 w-full h-full opacity-0 transition-opacity duration-200 focus:outline-none upload-button-overlay"
							onClick={handleUploadImage}
							data-testid="SelectProfileImage__upload-button"
						>
							<div className="flex justify-center items-center h-full rounded-full dark:bg-black bg-theme-secondary-900 opacity-85">
								<Icon
									name="ArrowUpBracket"
									className="text-white dark:text-theme-secondary-200"
									size="lg"
								/>
							</div>
						</button>
					</ProfileImageStyled>

					{!isSvg && (
						<div className="absolute z-20 -top-3 -right-3 ">
							<Button
								size="icon"
								variant="danger"
								className="flex justify-center items-center p-1 w-6 h-6"
								onClick={() => onSelect("")}
								data-testid="SelectProfileImage__remove-button"
							>
								<Icon name="Cross" size="sm" />
							</Button>
						</div>
					)}
				</div>
			);
		}

		return (
			<div className="p-1 w-20 h-20 rounded-md border-2 border-dashed focus-within:border-solid border-theme-secondary-400 dark:border-theme-secondary-700 focus-within:border-theme-primary-400">
				<div className="overflow-hidden h-full rounded-full">
					<UploadButtonWrapper>
						<Button
							variant="secondary"
							onClick={handleUploadImage}
							data-testid="SelectProfileImage__upload-button"
						>
							<Icon
								name="ArrowUpBracket"
								className="text-theme-primary-600 dark:text-theme-secondary-200"
								size="lg"
							/>
						</Button>
					</UploadButtonWrapper>
				</div>
			</div>
		);
	};

	return (
		<div className={cn("group space-y-2", className)}>
			{showLabel && (
				<span className="text-sm font-semibold transition-colors duration-100 cursor-default text-theme-secondary-text group-hover:text-theme-primary-600">
					{t("SETTINGS.GENERAL.PERSONAL.PROFILE_IMAGE")}
				</span>
			)}

			<div className="flex flex-row">{renderButton()}</div>
		</div>
	);
};
