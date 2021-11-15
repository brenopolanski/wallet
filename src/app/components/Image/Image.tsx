import { Contracts } from "@payvo/sdk-profiles";
import { images } from "app/assets/images";
import { useActiveProfile } from "app/hooks";
import { useAccentColor } from "app/hooks/use-accent-color";
import React from "react";
import { shouldUseDarkColors } from "utils/electron-utils";

type Properties = {
	name: string;
	domain?: string;
} & React.HTMLProps<any>;

export const Image = ({ name, domain = "common", ...properties }: Properties) => {
	const [imageName, setImageName] = React.useState("");
	const { getCurrentAccentColor } = useAccentColor();
	const currentAccentColor = getCurrentAccentColor();

	// TODO: remove try/catch usage
	let profile: Contracts.IProfile | undefined;
	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		profile = useActiveProfile();
	} catch {
		profile = undefined;
	}

	React.useLayoutEffect(() => {
		let imageName: string = name;

		if (shouldUseDarkColors()) {
			imageName = `${imageName}Dark`;
		} else {
			imageName = `${imageName}Light`;
		}

		const theme: string = currentAccentColor.charAt(0).toUpperCase() + currentAccentColor.slice(1);

		setImageName(`${imageName}${theme}`);
	}, [name, profile, currentAccentColor]);

	const Image = (images as any)[domain][imageName] || (images as any)[domain][name];

	if (typeof Image === "string") {
		return <img src={Image} alt="" {...(properties as React.ImgHTMLAttributes<any>)} />;
	}

	return Image ? <Image {...properties} /> : null;
};
