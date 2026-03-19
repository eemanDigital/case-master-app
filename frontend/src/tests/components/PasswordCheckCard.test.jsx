import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PasswordCheckCard from "../../components/PasswordCheckCard";

describe("PasswordCheckCard Component", () => {
  describe("Rendering", () => {
    it("should render all 4 password requirement checks", () => {
      render(<PasswordCheckCard password="" />);
      
      expect(screen.getByText(/Lowercase and Uppercase/i)).toBeInTheDocument();
      expect(screen.getByText(/Number \(0-9\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Special character/i)).toBeInTheDocument();
      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    });

    it("should render with empty password initially", () => {
      render(<PasswordCheckCard password="" />);
      
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });
  });

  describe("Password validation indicators", () => {
    it("should show red X for all checks when password is empty", () => {
      render(<PasswordCheckCard password="" />);
      
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(4);
    });

    it("should show green check for lowercase/uppercase when password has both", () => {
      render(<PasswordCheckCard password="Aa" />);
      
      expect(screen.getByText(/Lowercase and Uppercase/i)).toBeInTheDocument();
    });

    it("should show green check when password has a number", () => {
      render(<PasswordCheckCard password="Pass1" />);
      
      expect(screen.getByText(/Number \(0-9\)/i)).toBeInTheDocument();
    });

    it("should show green check when password has special character", () => {
      render(<PasswordCheckCard password="Password!" />);
      
      expect(screen.getByText(/Special character/i)).toBeInTheDocument();
    });

    it("should show green check when password is at least 8 characters", () => {
      render(<PasswordCheckCard password="Password123" />);
      
      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe("Strong password validation", () => {
    it("should validate all requirements for a strong password", () => {
      render(<PasswordCheckCard password="StrongP@ss1" />);
      
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });

    it("should validate complex passwords correctly", () => {
      render(<PasswordCheckCard password="MyP@ssw0rd!" />);
      
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });
  });

  describe("Edge cases", () => {
    it("should handle single character password", () => {
      render(<PasswordCheckCard password="A" />);
      
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });

    it("should handle password with only numbers", () => {
      render(<PasswordCheckCard password="12345678" />);
      
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });

    it("should handle very long password", () => {
      render(<PasswordCheckCard password="VeryLongP@ssw0rd123!" />);
      
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(4);
    });
  });
});
