import { type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";
import { User } from "../../../database/models/User";
import {
  type UserRegisterCredentials,
  type UserCredentials,
} from "../../../types/types";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginUser, registerUser } from "./usersControllers";
import { CustomError } from "../../../CustomError/CustomError";

const res: Partial<Response> = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
const req: Partial<
  Request<Record<string, unknown>, Record<string, unknown>, UserCredentials>
> = {};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

const user: UserCredentials = {
  email: "jordi@gmail.com",
  password: "12345678",
};

describe("Given a loginUser function", () => {
  describe("When it receives a request with an email 'jordi@gmail.com' and a password '12345678'", () => {
    test("Then it should call its status method with 200 and its json method with a token", async () => {
      const expectedStatus = 200;
      req.body = user;
      const expectedResponse = { token: "dsjakhsdsagdhgashj" };

      User.findOne = jest.fn().mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          ...user,
          _id: new mongoose.Types.ObjectId(),
        }),
      }));

      bcryptjs.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue("dsjakhsdsagdhgashj");

      await loginUser(
        req as Request<
          Record<string, unknown>,
          Record<string, unknown>,
          UserCredentials
        >,
        res as Response,
        next
      );

      expect(res.status).toHaveBeenCalledWith(expectedStatus);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe("When it receives a correct email 'jordi@gmail.com' and a bad password '123232323'", () => {
    test("Then it should respond with status 401 and a message 'Wrong credentials'", async () => {
      const wrongUser: UserCredentials = {
        email: "jordi@gmail.com",
        password: "123232323",
      };
      req.body = wrongUser;
      const expectedError = new CustomError(
        "Wrong credentials",
        401,
        "Wrong credentials"
      );

      User.findOne = jest.fn().mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          ...wrongUser,
          _id: new mongoose.Types.ObjectId(),
        }),
      }));

      bcryptjs.compare = jest.fn().mockResolvedValue(false);

      await loginUser(
        req as Request<
          Record<string, unknown>,
          Record<string, unknown>,
          UserCredentials
        >,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(expectedError);
    });
  });

  describe("When it receives a request with an email 'jordi@gmail.com' and a password '12345678' but the user doesn't exists in the data base", () => {
    test("Then it should call its next method with status 401 and the message 'Wrong credentials'", async () => {
      const expectedError = new CustomError(
        "Wrong credentials",
        401,
        "Wrong credentials"
      );
      req.body = user;

      User.findOne = jest.fn().mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(undefined),
      }));

      await loginUser(
        req as Request<
          Record<string, unknown>,
          Record<string, unknown>,
          UserCredentials
        >,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(expectedError);
    });
  });

  describe("When the data base rejects the request and responds with an error", () => {
    test("Then it should call its next method", async () => {
      const error = new Error("Fatal error");

      User.findOne = jest.fn().mockImplementationOnce(() => ({
        exec: jest.fn().mockRejectedValue(error),
      }));

      await loginUser(
        req as Request<
          Record<string, unknown>,
          Record<string, unknown>,
          UserCredentials
        >,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

describe("Given a registerUser controller", () => {
  describe("When it receives a request to register the user correctly", () => {
    test("Then it should call its status method and its json method with the message 'The user has been created'", async () => {
      const mockUser: UserRegisterCredentials = {
        email: "victor@andujar.org",
        password: "12345678",
        name: "victor",
      };

      const expectedMessage = { message: "The user has been created" };
      const expectedStatusCode = 201;

      req.body = mockUser;
      bcryptjs.hash = jest.fn().mockResolvedValue("vik27634fvj");
      User.create = jest.fn().mockResolvedValue(mockUser);

      await registerUser(
        req as Request<
          Record<string, unknown>,
          Record<string, unknown>,
          UserRegisterCredentials
        >,
        res as Response,
        next
      );

      expect(res.status).toHaveBeenCalledWith(expectedStatusCode);
      expect(res.json).toHaveBeenCalledWith(expectedMessage);
    });
  });

  describe("When it receives a user with a invalid length password", () => {
    test("Then it should show an error with the text 'The user couldn't be created'", async () => {
      const mockUser: UserRegisterCredentials = {
        name: "victor",
        password: "1234567",
        email: "victor@andujar.org",
      };

      const expectedError = new CustomError(
        "The user couldn't be created.",
        409,
        "There was a problem creating the user."
      );

      req.body = mockUser;
      User.create = jest.fn().mockRejectedValue(undefined);

      await registerUser(
        req as Request<
          Record<string, unknown>,
          Record<string, unknown>,
          UserRegisterCredentials
        >,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(expectedError);
    });
  });
});
