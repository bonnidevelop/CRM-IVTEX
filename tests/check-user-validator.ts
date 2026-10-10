import {
  createUserSchema,
} from "../src/validators/user.validator.js";

const validUser = {
  name: "Bonni Das",
  email: "BONNI@example.com",
  phone: "9876543210",
  password: "example-password",
};

const validResult = createUserSchema.safeParse(validUser);

if (!validResult.success) {
  console.error(validResult.error.issues);
  throw new Error("Valid user was rejected");
}

console.log("Valid input:", validResult.data);

const invalidResult = createUserSchema.safeParse({
  ...validUser,
  email: "not-an-email",
  isAdmin: true,
});

if (invalidResult.success) {
  throw new Error("Invalid input was accepted");
}

console.log(
  "Invalid input correctly rejected:",
  invalidResult.error.issues
);