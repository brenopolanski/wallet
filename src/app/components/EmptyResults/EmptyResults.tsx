import { Image } from "app/components/Image";
import cn from "classnames";
import React from "react";

interface EmptyResultsProperties {
	className?: string;
	title?: string;
	subtitle?: string;
}

export const EmptyResults = ({ className, title, subtitle }: EmptyResultsProperties) => (
	<div
		className={cn("flex flex-col justify-center h-full text-center bg-theme-background", className)}
		data-testid="EmptyResults"
	>
		<div>
			{title && <div className="mb-4 text-lg font-bold">{title}</div>}
			{subtitle && <div className="mb-8 text-md">{subtitle}</div>}
			<div className="my-4 mx-auto w-128">
				<Image name="NoResultsBanner" />
			</div>
		</div>
	</div>
);
