
import { describe, expect, it } from "vitest";

import {
  createUserSchema,
} from "../src/validators/user.validator.js";

describe("createUserSchema", () => {
  const validUser = {
    name: "Bonni Das",
    email: "BONNI@example.com",
    phone: "9876543210",
    password: "example-password",
  };

  it("accepts valid user input", () => {
    const result = createUserSchema.safeParse(validUser);

    expect(result.success).toBe(true);
  });

  it("normalizes the email to lowercase", () => {
    const result = createUserSchema.safeParse(validUser);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("bonni@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected properties", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      isAdmin: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than eight characters", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
