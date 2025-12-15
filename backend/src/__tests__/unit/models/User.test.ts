import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../../../models/User';

let mongoServer: MongoMemoryServer;

describe('User Model Test', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should create & save a user successfully', async () => {
    const userData = {
      employeeCode: 'EMP001',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'requester' as const,
    };
    const validUser = new User(userData);
    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.employeeCode).toBe(userData.employeeCode);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.firstName).toBe(userData.firstName);
    expect(savedUser.lastName).toBe(userData.lastName);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.isActive).toBe(true);
  });

  it('should fail if required fields are missing', async () => {
    const userData = {
      // Missing required fields
    };
    const invalidUser = new User(userData);
    let err: any;
    try {
      await invalidUser.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.employeeCode).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.firstName).toBeDefined();
    expect(err.errors.lastName).toBeDefined();
  });

  it('should hash password on save', async () => {
    const password = 'Password123!';
    const user = new User({
      employeeCode: 'EMP002',
      email: 'test2@example.com',
      password: password,
      firstName: 'Test',
      lastName: 'User',
    });
    await user.save();
    const userInDb = await User.findOne({ email: 'test2@example.com' }).select('+password');
    expect(userInDb).toBeDefined();
    expect(userInDb!.password).not.toBe(password);
    const isMatch = await userInDb!.comparePassword(password);
    expect(isMatch).toBe(true);
  });
});
