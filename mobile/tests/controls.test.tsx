import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button, ErrorMessage, Field } from "../src/components/ui";
import { Page, Pager, QueryState, Select, Values } from "../src/features/common";
import { ApiError } from "../../shared/api-client";
import { router } from "expo-router";
import { jest, test, expect } from "@jest/globals";

test("busy commands cannot fire twice and expose accessible state", async () => {
  const press = jest.fn();
  const result = await render(<Button title="Save" onPress={press} busy />);
  expect(screen.getByRole("button", { name: "Save" }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  expect(press).not.toHaveBeenCalled();
  await result.rerender(<Button title="Save" onPress={press} />);
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  expect(press).toHaveBeenCalledTimes(1);
});
test("fields preserve input and associate safe validation text", async () => {
  const change = jest.fn();
  await render(<Field label="Customer email" value="wrong" onChangeText={change} error="Enter a valid email" />);
  await fireEvent.changeText(screen.getByLabelText("Customer email"), "owner@example.test");
  expect(change).toHaveBeenCalledWith("owner@example.test");
  expect(screen.getByRole("alert").props.children).toBe("Enter a valid email");
});
test("query states distinguish loading, empty and safe retry errors", async () => {
  const refetch = jest.fn();
  const result = await render(<QueryState query={{ isPending: true, error: null, refetch }} />);
  expect(screen.getByLabelText("Loading records")).toBeTruthy();
  await result.rerender(<QueryState query={{ isPending: false, error: null, refetch }} empty />);
  expect(screen.getByText("No records available.")).toBeTruthy();
  await result.rerender(<QueryState query={{ isPending: false, error: new ApiError("Cannot reach the server"), refetch }} />);
  await fireEvent.press(screen.getByRole("button", { name: "Retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
test("pagination never offers a next page after the last page", async () => {
  const setPage = jest.fn();
  await render(<Pager page={2} setPage={setPage} pagination={{ total: 45, page: 2, pageSize: 30, pageCount: 2 }} />);
  expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Previous" }));
  expect(setPage).toHaveBeenCalledWith(1);
});
test("detail values preserve zero and false without invented fallback data", async () => {
  await render(<Values values={{ Amount: 0, Interested: false, Address: null }} />);
  expect(screen.getByText("0")).toBeTruthy(); expect(screen.getByText("false")).toBeTruthy();
  expect(screen.getByText("Not provided")).toBeTruthy();
});
test("a deep-linked page has a home recovery action", async () => {
  await render(<Page title="Customer"><ErrorMessage message="Record not found" /></Page>);
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith("/home");
});
test("read-only selections expose a disabled native control", async () => {
  const change = jest.fn();
  await render(<Select label="Customer" value="one" disabled onChange={change} options={[{ label: "One", value: "one" }]} />);
  const picker = screen.getByTestId("select-customer");
  expect(picker.props.accessibilityState.disabled).toBe(true);
});
test("filtered empty states explain how to recover", async () => {
  await render(<QueryState query={{ isPending: false, error: null, refetch: jest.fn() }} empty
    emptyTitle="No matching records" emptyMessage="Adjust the filters and try again." />);
  expect(screen.getByText("No matching records")).toBeTruthy();
  expect(screen.getByText("Adjust the filters and try again.")).toBeTruthy();
});
