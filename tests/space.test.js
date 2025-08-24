import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import {User} from "../src/models/user.model.js"; 
import {Space} from "../src/models/space.model.js"; 


describe("POST /api/v1/space/create", () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect("mongodb+srv://bhargav:1602yash@cluster0.c0nnag6.mongodb.net/space");

    // Create a test user
    await request(app).post("/api/v1/user/signup").send({
      username: "spaceuser",
      password: "test123"
    });

    // Login and get token
    const loginRes = await request(app).post("/api/v1/user/login").send({
      username: "spaceuser",
      password: "test123"
    });

    token = loginRes.body.data.token;
    userId = (await User.findOne({ username: "spaceuser" }))._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Space.deleteMany({});
    await mongoose.disconnect();
  });

  it("should create a space successfully", async () => {

    const res = await request(app)
      .post("/api/v1/space/createSpace")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "room1", selfDestructTime: '1hr' });

    expect(res.body.statusCode).toBe(201);
    expect(res.body.message).toBe("Space Creation Success");
    expect(res.body.data.name).toBe("spaceuser/room1");
  });

  it("should throw error if name is missing", async () => {
    const res = await request(app)
      .post("/api/v1/space/createSpace")
      .set("Authorization", `Bearer ${token}`)
      .send({ selfDestructTime: '1hr' });

    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Incomplete Inputs");
  });

  it("should throw error if space with same name already exists", async () => {

    await request(app)
      .post("/api/v1/space/createSpace")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "room2" });

    const res = await request(app)
      .post("/api/v1/space/createSpace")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "room2" });

    expect(res.error.status).toBe(400);
    expect(res.body.message).toBe("Room Exists with Same Name");
  });


});
