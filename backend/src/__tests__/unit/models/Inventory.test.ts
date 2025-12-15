import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Inventory from '../../../models/Inventory';
import Product from '../../../models/Product';
import Department from '../../../models/Department';
import User from '../../../models/User';
import Category from '../../../models/Category';

let mongoServer: MongoMemoryServer;

describe('Inventory Model Test', () => {
  let product: mongoose.Types.ObjectId;
  let department: mongoose.Types.ObjectId;
  let user: mongoose.Types.ObjectId;
  let category: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create mock data
    const userDoc = await User.create({
      employeeCode: 'U001',
      email: 'user@test.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User'
    });
    user = userDoc._id;

    const departmentDoc = await Department.create({
        name: 'IT',
        code: 'IT01',
        budget: {
            year: new Date().getFullYear(),
            total: 100000,
            consumed: 0,
            currency: 'MXN'
        }
    });
    department = departmentDoc._id;

    const categoryDoc = await Category.create({
        name: 'Electronics',
        code: 'E01'
    });
    category = categoryDoc._id;

    const productDoc = await Product.create({
        code: 'P001',
        name: 'Laptop',
        category: category,
        unitOfMeasure: 'PZA',
        createdBy: user
    });
    product = productDoc._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Inventory.deleteMany({});
  });

  it('should create & save an inventory item successfully', async () => {
    const inventoryData = {
      product,
      department,
      quantity: 10,
      location: 'SHELF-A1',
      lastUpdatedBy: user,
    };
    const inventoryItem = new Inventory(inventoryData);
    const savedItem = await inventoryItem.save();

    expect(savedItem._id).toBeDefined();
    expect(savedItem.product).toEqual(product);
    expect(savedItem.department).toEqual(department);
    expect(savedItem.quantity).toBe(10);
    expect(savedItem.location).toBe('SHELF-A1');
  });

  it('should fail if required fields are missing', async () => {
    const inventoryData = {
      // product and department are missing
      quantity: 5,
      lastUpdatedBy: user,
    };
    const inventoryItem = new Inventory(inventoryData);
    let err: any;
    try {
      await inventoryItem.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.product).toBeDefined();
    expect(err.errors.department).toBeDefined();
  });

  it('should fail on creating a duplicate product for the same department', async () => {
    const inventoryData = {
      product,
      department,
      quantity: 10,
      lastUpdatedBy: user,
    };
    const item1 = new Inventory(inventoryData);
    await item1.save();

    const item2 = new Inventory(inventoryData);
    let err: any;
    try {
      await item2.save();
    } catch (error) {
      err = error;
    }
    expect(err.code).toBe(11000); // Duplicate key error code
  });
});
