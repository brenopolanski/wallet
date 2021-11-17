import { Contracts } from "@payvo/sdk-profiles";
import { SerializedPluginConfigurationData } from "plugins/types";
import { Asserts } from "yup";

import { schema } from "./schema";

export interface IPluginConfigurationData {
	validate(): Asserts<typeof schema>;

	get<T = string>(key: string, defaultValue?: T): T | undefined;

	manifest(): Contracts.IDataRepository;

	name(): string;

	id(): string;

	archiveUrl(): string | undefined;

	author(): string;

	keywords(): string[];

	categories(): string[];

	category(): string;

	hasCategory(categoryName: string): boolean;

	date(): string | undefined;

	description(): string | undefined;

	homepage(): string | undefined;

	images(): string[];

	permissions(): string[];

	urls(): string[];

	minimumVersion(): string | undefined;

	version(): string;

	logo(): string | undefined;

	size(): string;

	title(): string | undefined;

	isOfficial(): boolean;

	url(): string | undefined;

	isCompatible(): boolean;

	toObject(): SerializedPluginConfigurationData;
}
