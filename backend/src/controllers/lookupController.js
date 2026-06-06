const { Role, Department, Position } = require('../models');

/**
 * Lookup Controller
 * Provides dropdown/select options for roles and departments.
 * Used by the frontend to populate form selects dynamically.
 */

/**
 * GET /api/roles
 * Returns all roles (id, name, description).
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['id', 'ASC']],
    });
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/departments
 * Returns all departments (id, name, code).
 */
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']],
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/positions
 * Returns all active positions (id, title, job_grade).
 */
const getPositions = async (req, res, next) => {
  try {
    const positions = await Position.findAll({
      attributes: ['id', 'title', 'job_grade'],
      where: { is_active: true },
      order: [['title', 'ASC']],
    });
    res.json({ positions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getDepartments,
  getPositions,
};
