import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth endpoints (login/register use /users/ prefix in the actual service)
  http.post("*/api/v1/users/login", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        user: {
          _id: "user123",
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "lawyer",
        },
        token: "mock-jwt-token",
      },
    });
  }),

  http.post("*/api/v1/users/register", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        user: {
          _id: "user123",
          email: "new@example.com",
          firstName: "New",
          lastName: "User",
        },
        token: "mock-jwt-token",
      },
    });
  }),

  http.get("*/api/v1/users/getUser", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        _id: "user123",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "lawyer",
      },
    });
  }),

  http.post("*/api/v1/users/forgotpassword", () => {
    return HttpResponse.json({
      status: "success",
      message: "Password reset email sent",
    });
  }),

  // User endpoints
  http.get("*/api/v1/users", () => {
    return HttpResponse.json({
      status: "success",
      data: [
        { _id: "1", firstName: "John", lastName: "Doe", email: "john@example.com" },
        { _id: "2", firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  }),

  http.get("*/api/v1/users/:id", ({ params }) => {
    return HttpResponse.json({
      status: "success",
      data: {
        _id: params.id,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
    });
  }),

  http.delete("*/api/v1/users/delete/:id", () => {
    return HttpResponse.json({
      status: "success",
      message: "User deleted",
    });
  }),

  // Matter endpoints
  http.get("*/api/v1/matters", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        matters: [
          {
            _id: "matter1",
            title: "Test Case",
            status: "active",
            matterType: "litigation",
            priority: "high",
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });
  }),

  http.post("*/api/v1/matters", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        matter: {
          _id: "newMatter123",
          title: "New Matter",
          status: "pending",
        },
      },
    });
  }),

  http.put("*/api/v1/matters/:id", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        matter: {
          _id: "matter1",
          title: "Updated Matter",
          status: "active",
        },
      },
    });
  }),

  http.delete("*/api/v1/matters/:id", () => {
    return HttpResponse.json({
      status: "success",
      message: "Matter deleted",
    });
  }),

  // Statistics endpoints (under /users/statistics/*)
  http.get("*/api/v1/users/statistics/general", () => {
    return HttpResponse.json({
      status: "success",
      data: { total: 100, active: 80 },
    });
  }),

  http.get("*/api/v1/users/statistics/staff", () => {
    return HttpResponse.json({
      status: "success",
      data: { total: 50, active: 45 },
    });
  }),

  http.get("*/api/v1/users/statistics/clients", () => {
    return HttpResponse.json({
      status: "success",
      data: { total: 500, active: 450 },
    });
  }),

  http.get("*/api/v1/users/statistics/status", () => {
    return HttpResponse.json({
      status: "success",
      data: { active: 100, inactive: 20 },
    });
  }),
];
