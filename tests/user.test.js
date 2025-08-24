import mongoose from "mongoose"
import request from "supertest"
import app from "../src/app"


beforeEach(async () => {
  await mongoose.connect("mongodb+srv://bhargav:1602yash@cluster0.c0nnag6.mongodb.net/space");
});

afterEach(async () => {
  await mongoose.connection.close();
});

describe("POST /api/v1/user/signup", () => {

  it("should signup a new user", async () => {
    const res = await request(app).post("/api/v1/user/signup").send({
      username: "loginuser",
      password: "test123"
    });
    expect(res.body.statusCode).toBe(201);
    expect(res.body.message).toBe("User Registration Sucess");
  });

  it("should throw a duplicate username error", async () => {
    const res = await request(app).post("/api/v1/user/signup").send({
      username: "loginuser", // same username as above
      password: "test123"
    });
    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Username already exists");
  });

  it("should throw error if username is missing", async () => {
    const res = await request(app).post("/api/v1/user/signup").send({
      password: "test123"
    });
    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Inputs missing");
  });

  it("should throw error if password is missing", async () => {
    const res = await request(app).post("/api/v1/user/signup").send({
      username: "newuser"
    });
    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Inputs missing");
  });

  it("should throw error if body is empty", async () => {
    const res = await request(app).post("/api/v1/user/signup").send({});
    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Inputs missing");
  });

});

describe("POST /api/v1/user/login", () => {

  it("should login successfully with correct credentials", async () => {

    await request(app).post("/api/v1/user/signup").send({
      username: "loginuser",
      password: "test123"
    });

    const res = await request(app).post("/api/v1/user/login").send({
      username: "loginuser",
      password: "test123"
    });

    expect(res.body.statusCode).toBe(201);
    expect(res.body.message).toBe("Login Success");
    expect(res.body.data.token).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined(); // cookie should be set
  });

  it("should throw error if username is missing", async () => {
    const res = await request(app).post("/api/v1/user/login").send({
      password: "test123"
    });

    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Inputs missing");
  });

  it("should throw error if password is missing", async () => {
    const res = await request(app).post("/api/v1/user/login").send({
      username: "loginuser"
    });

    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Inputs missing");
  });

  it("should throw error if body is empty", async () => {
    const res = await request(app).post("/api/v1/user/login").send({});

    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Inputs missing");
  });

  it("should throw error if user does not exist", async () => {
    const res = await request(app).post("/api/v1/user/login").send({
      username: "doesnotexist",
      password: "test123"
    });

    expect(res.error.status).toBe(500);
    expect(res.body.message).toBe("User Dont Exists");
  });

  it("should throw error if password is invalid", async () => {
    const res = await request(app).post("/api/v1/user/login").send({
      username: "loginuser",
      password: "wrongpassword"
    });

    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Invalid Password");
  });

});


