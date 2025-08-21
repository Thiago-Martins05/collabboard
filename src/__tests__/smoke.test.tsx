import React from "react";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <h1>hello-test</h1>;
}

test("render smoke", () => {
  render(<Hello />);
  expect(screen.getByText("hello-test")).toBeInTheDocument();
});
