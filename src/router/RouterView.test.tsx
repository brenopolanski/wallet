/* eslint-disable react/display-name */
import { createMemoryHistory } from "history";
import React from "react";
import { MemoryRouter, Router, withRouter } from "react-router-dom";
import { render } from "utils/testing-library";

import { Middleware, MiddlewareParams as MiddlewareParameters } from "./interfaces";
import { RouterView } from "./RouterView";

describe("RouterView", () => {
	const LocationDisplay = withRouter(({ location }) => (
		// @ts-ignore
		<div data-testid="location-display">{location.location?.pathname || location.pathname}</div>
	));

	it("should render", () => {
		const { getByTestId, asFragment } = render(
			<MemoryRouter>
				<RouterView routes={[{ component: () => <h1>Test</h1>, path: "/" }]} />
			</MemoryRouter>,
		);

		expect(getByTestId("RouterView__wrapper")).toHaveTextContent("Test");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with custom wrapper", () => {
		const { getByTestId, asFragment } = render(
			<MemoryRouter>
				<RouterView wrapper="section" routes={[{ component: () => <h1>Test</h1>, path: "/" }]} />
			</MemoryRouter>,
		);

		expect(getByTestId("RouterView__wrapper").tagName).toBe("SECTION");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should scroll to top on route change", () => {
		const windowSpy = jest.spyOn(window, "scrollTo");

		const history = createMemoryHistory();
		history.push("/test");

		render(
			<Router history={history}>
				<RouterView
					routes={[
						{ component: () => <h1>Test 1</h1>, path: "/test" },
						{ component: () => <h1>Test 2</h1>, path: "/test2" },
					]}
				/>
			</Router>,
		);

		history.push("/test2");
		history.replace("/test");

		expect(windowSpy).toHaveBeenCalledTimes(2);
	});

	it("should not scroll to top when route does not change", () => {
		const windowSpy = jest.spyOn(window, "scrollTo");

		const history = createMemoryHistory();
		history.push("/test");

		render(
			<Router history={history}>
				<RouterView routes={[{ component: () => <h1>Test</h1>, path: "/test" }]} />
			</Router>,
		);

		history.push("/test");
		history.replace("/test");

		expect(windowSpy).toHaveBeenCalledTimes(1);
	});

	it("should block /test router", () => {
		const handler = jest.fn(({ location }: MiddlewareParameters) => location.pathname !== "/test");
		const testMiddleware: Middleware = {
			handler,
		};

		const history = createMemoryHistory();
		history.push("/test");

		const { getByTestId } = render(
			<Router history={history}>
				<RouterView
					routes={[{ component: () => <h1>Test</h1>, path: "/test" }, { component: () => <h1>Home</h1> }]}
					middlewares={[testMiddleware]}
				/>
			</Router>,
		);

		expect(handler).toHaveBeenCalledTimes(2);
		expect(getByTestId("RouterView__wrapper")).toHaveTextContent("Home");
	});

	it("should block /test router and redirect to a custom url", () => {
		const handler = jest.fn(({ location, redirect }: MiddlewareParameters) => {
			if (location.pathname === "/test") {
				redirect("/custom");
				return false;
			}
			return true;
		});

		const testMiddleware: Middleware = {
			handler,
		};

		const history = createMemoryHistory();
		history.push("/test");

		const { getByTestId } = render(
			<Router history={history}>
				<>
					<RouterView
						routes={[
							{ component: () => <h1>Test</h1>, path: "/test" },
							{ component: () => <h1>Custom</h1>, path: "/custom" },
						]}
						middlewares={[testMiddleware]}
					/>
					<LocationDisplay />
				</>
			</Router>,
		);

		expect(handler).toHaveBeenCalledTimes(2);
		expect(getByTestId("location-display")).toHaveTextContent("/custom");
	});
});
