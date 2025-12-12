import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Department from '../models/Department';

// @desc    Crear un nuevo departamento
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, costCenter, manager } = req.body;

  const departmentExists = await Department.findOne({ $or: [{ code }, { name }] });

  if (departmentExists) {
    res.status(400);
    throw new Error('El departamento ya existe');
  }

  const department = await Department.create({
    code,
    name,
    costCenter,
    manager,
  });

  if (department) {
    res.status(201).json(department);
  } else {
    res.status(400);
    throw new Error('Datos de departamento inválidos');
  }
});

// @desc    Obtener todos los departamentos
// @route   GET /api/departments
// @access  Private
const getDepartments = asyncHandler(async (req: Request, res: Response) => {
  const departments = await Department.find({}).populate('manager', 'firstName lastName');
  res.json(departments);
});

// @desc    Obtener un departamento por ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
  const department = await Department.findById(req.params.id).populate('manager', 'firstName lastName');

  if (department) {
    res.json(department);
  } else {
    res.status(404);
    throw new Error('Departamento no encontrado');
  }
});

// @desc    Actualizar un departamento
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { name, costCenter, manager, isActive } = req.body;

  const department = await Department.findById(req.params.id);

  if (department) {
    department.name = name || department.name;
    department.costCenter = costCenter || department.costCenter;
    department.manager = manager || department.manager;
    department.isActive = isActive === undefined ? department.isActive : isActive;

    const updatedDepartment = await department.save();
    res.json(updatedDepartment);
  } else {
    res.status(404);
    throw new Error('Departamento no encontrado');
  }
});

// @desc    Eliminar un departamento
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await Department.findById(req.params.id);

  if (department) {
    await department.deleteOne();
    res.json({ message: 'Departamento eliminado' });
  } else {
    res.status(404);
    throw new Error('Departamento no encontrado');
  }
});

export {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
