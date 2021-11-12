/* eslint-disable @typescript-eslint/require-await */
import * as passwordPwnd from "@faustbrian/node-haveibeenpwned";
import { renderHook } from "@testing-library/react-hooks";
import { useTranslation } from "react-i18next";

import { password } from "./password";

describe("Password Validation", () => {
	let pwnd: jest.SpyInstance;

	beforeEach(() => {
		pwnd = jest.spyOn(passwordPwnd, "pwned").mockImplementation(() => Promise.resolve(0));
	});

	it("should not be required", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		await expect(passwordValidation.password().validate("")).resolves.toBe(true);
	});

	it("should require at least 1 lowercase character", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		await expect(passwordValidation.password().validate("NO_LOWER")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_WEAK"),
		);
		expect(pwnd).not.toHaveBeenCalled();
	});

	it("should require at least 1 uppercase character", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		await expect(passwordValidation.password().validate("no_upper")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_WEAK"),
		);
		expect(pwnd).not.toHaveBeenCalled();
	});

	it("should require at least 1 numeric character", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		await expect(passwordValidation.password().validate("NoNumeric")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_WEAK"),
		);
		expect(pwnd).not.toHaveBeenCalled();
	});

	it("should require at least 1 special character", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		await expect(passwordValidation.password().validate("N0SpecialChar5")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_WEAK"),
		);
		expect(pwnd).not.toHaveBeenCalled();
	});

	it("should be at least 8 characters long", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		await expect(passwordValidation.password().validate("shortpw")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_WEAK"),
		);
		expect(pwnd).not.toHaveBeenCalled();
	});

	it("should require the password not to have been leaked", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		pwnd.mockImplementation(() => Promise.resolve(1));

		await expect(passwordValidation.password().validate("S3cUr3!Pas#w0rd")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_LEAKED"),
		);
		expect(pwnd).toHaveBeenCalledWith("S3cUr3!Pas#w0rd");

		pwnd.mockImplementation(() => Promise.resolve(0));

		await expect(passwordValidation.password().validate("S3cUr3!Pas#w0rd")).resolves.toBe(true);
		expect(pwnd).toHaveBeenCalledWith("S3cUr3!Pas#w0rd");
	});

	it("should ignore leaked validation if haveibeenpwned API is unreachable", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;
		const passwordValidation = password(t);

		pwnd.mockImplementation(() => Promise.reject());

		await expect(passwordValidation.password().validate("S3cUr3!Pas#w0rd")).resolves.toBe(true);
	});

	it("should require different password than the old password", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		const passwordRule = password(t).password("S3cUr3!Pas#w0rd");

		await expect(passwordRule.validate("S3cUr3!Pas#w0rd")).resolves.toBe(
			t("COMMON.VALIDATION.PASSWORD_SAME_AS_OLD"),
		);
		await expect(passwordRule.validate("S3cUr3!Pas#w0rd2different")).resolves.toBe(true);
	});

	it("should match password and confirm password", () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		const passwordValidation = password(t);
		const confirmPassword = passwordValidation.confirmPassword("password");

		expect(confirmPassword.validate("password")).toBe(true);
	});

	it("should fail on password and confirm password mismatch", () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		const passwordValidation = password(t);
		const confirmPassword = passwordValidation.confirmPassword("password");

		expect(confirmPassword.validate("password2")).toBe(t("COMMON.VALIDATION.PASSWORD_MISMATCH"));
	});

	it("should require password to be entered before confirm password", () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		const passwordValidation = password(t);
		const confirmPassword = passwordValidation.confirmPassword();

		expect(confirmPassword.validate("password2")).toBe(
			t("COMMON.VALIDATION.FIELD_REQUIRED", {
				field: t("SETTINGS.GENERAL.PERSONAL.PASSWORD"),
			}).toString(),
		);
	});

	it("should confirm optional password", () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		const passwordValidation = password(t);
		const confirmPassword = passwordValidation.confirmOptionalPassword();

		expect(confirmPassword.validate()).toBe(true);
		expect(confirmPassword.validate()).toBe(true);
		expect(confirmPassword.validate("password")).toBe(
			t("COMMON.VALIDATION.FIELD_REQUIRED", {
				field: t("SETTINGS.GENERAL.PERSONAL.PASSWORD"),
			}).toString(),
		);
	});

	it("should fail validation if optional password is set", () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		const passwordValidation = password(t);
		const confirmPassword = passwordValidation.confirmOptionalPassword("test");

		expect(confirmPassword.validate()).toBe(t("COMMON.VALIDATION.PASSWORD_MISMATCH"));
		expect(confirmPassword.validate("test2")).toBe(t("COMMON.VALIDATION.PASSWORD_MISMATCH"));
	});
});
