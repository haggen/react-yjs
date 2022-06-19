import { render } from "@testing-library/react";

import { Room } from "./";

test("renders successfully", () => {
  render(<Room roomId="123" />);
});
