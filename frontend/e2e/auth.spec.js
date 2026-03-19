import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.goto("/users/login");
  });

  test("should display login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in to your account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation error for empty form", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/enter both/i)).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");
    
    await page.locator("button").filter({ has: page.locator("svg") }).click();
    
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("should have forgot password link", async ({ page }) => {
    const forgotLink = page.getByText(/forgot your password/i);
    await expect(forgotLink).toBeVisible();
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await page.getByText(/forgot your password/i).click();
    await expect(page).toHaveURL(/forgotpassword/i);
  });
});

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgotpassword");
  });

  test("should display forgot password form", async ({ page }) => {
    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill("not-an-email");
    await page.getByRole("button").click();
  });
});
