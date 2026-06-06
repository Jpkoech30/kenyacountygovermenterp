const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Person = require('../models/Person');
const User = require('../models/User');
const Content = require('../models/Content');
const Department = require('../models/Department');
const Role = require('../models/Role');
const Media = require('../models/Media');

/**
 * Persona Templates — predefined staff profiles with default mappings.
 */
const PERSONA_TEMPLATES = {
  cec_member: {
    label: 'CEC Member',
    description: 'County Executive Committee Member overseeing a department',
    defaultTitle: 'CEC — {department_name}',
    defaultRole: 'employee',
    createUser: true,
    createContent: true,
  },
  department_director: {
    label: 'Department Director',
    description: 'Director leading a county department',
    defaultTitle: 'Director of {department_name}',
    defaultRole: 'supervisor',
    createUser: true,
    createContent: true,
  },
  chief_officer: {
    label: 'Chief Officer',
    description: 'Chief Officer responsible for a specific portfolio',
    defaultTitle: 'Chief Officer — {department_name}',
    defaultRole: 'employee',
    createUser: true,
    createContent: true,
  },
  public_relations: {
    label: 'Public Relations Officer',
    description: 'Handles communications, media, and public engagement',
    defaultTitle: 'Public Relations Officer',
    defaultRole: 'employee',
    createUser: true,
    createContent: true,
  },
  county_attorney: {
    label: 'County Attorney',
    description: 'Legal advisor and representative for the county',
    defaultTitle: 'County Attorney',
    defaultRole: 'employee',
    createUser: true,
    createContent: true,
  },
  administrative_officer: {
    label: 'Administrative Officer',
    description: 'Handles administrative and coordination duties',
    defaultTitle: 'Administrative Officer',
    defaultRole: 'employee',
    createUser: true,
    createContent: false,
  },
  custom: {
    label: 'Custom Persona',
    description: 'Define your own staff profile with full control',
    defaultTitle: '',
    defaultRole: null,
    createUser: false,
    createContent: false,
  },
};

/**
 * GET /api/admin/persona/templates
 * Returns available persona templates with role options.
 */
const getTemplates = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']],
    });

    const templates = Object.entries(PERSONA_TEMPLATES).map(([key, tpl]) => ({
      key,
      label: tpl.label,
      description: tpl.description,
      defaultTitle: tpl.defaultTitle,
      defaultRole: tpl.defaultRole,
      createUser: tpl.createUser,
      createContent: tpl.createContent,
    }));

    res.json({ templates, roles });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/persona/wizard
 * Creates Person + optional Content + optional User in a single transaction.
 * Body:
 *   template: string
 *   person: { name, title, photo_id, bio_en, bio_sw, bio_pok, sort_order, social_links, department_id }
 *   user: { email, role_id, send_email, auto_generate_password } | null
 *   create_content: boolean
 */
const runWizard = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { template, person: personData, user: userData, create_content } = req.body;

    if (!personData || !personData.name) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation error',
        message: 'Person name is required.',
      });
    }

    // 1. Create Person record
    const person = await Person.create({
      name: personData.name,
      title: personData.title || '',
      photo_id: personData.photo_id || null,
      bio_en: personData.bio_en || null,
      bio_sw: personData.bio_sw || null,
      bio_pok: personData.bio_pok || null,
      sort_order: personData.sort_order ?? 0,
      social_links: personData.social_links || null,
    }, { transaction });

    // 2. Create Content record (type: person) if requested
    if (create_content) {
      const content = await Content.create({
        type: 'person',
        slug: `staff-${person.id}-${Date.now()}`,
        status: 'draft',
        title: personData.name,
        author_id: req.user.id,
        visibility: 'public',
      }, { transaction });

      person.content_id = content.id;
      await person.save({ transaction });
    }

    // 3. Create User account if opted in
    if (userData && userData.email) {
      const existingUser = await User.findOne({
        where: { email: userData.email },
        transaction,
      });

      if (existingUser) {
        await transaction.rollback();
        return res.status(409).json({
          error: 'Conflict',
          message: 'A user with this email already exists.',
        });
      }

      const password = userData.auto_generate_password
        ? Math.random().toString(36).slice(2, 10) + 'A1!'
        : userData.password || 'changeme123';

      const user = await User.create({
        email: userData.email,
        password_hash: password, // Will be hashed by User model hook
        first_name: personData.name.split(' ')[0] || '',
        last_name: personData.name.split(' ').slice(1).join(' ') || '',
        role_id: userData.role_id || null,
        department_id: personData.department_id || null,
        is_active: true,
      }, { transaction });

      person.user_id = user.id;
      await person.save({ transaction });
    }

    await transaction.commit();

    // Fetch the complete result with associations
    const result = await Person.findByPk(person.id, {
      include: [
        { model: Media, as: 'photo', attributes: ['id', 'filename', 'disk_filename', 'mime_type'] },
        { model: Content, as: 'content', attributes: ['id', 'slug', 'status', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'is_active'] },
      ],
    });

    res.status(201).json({ person: result });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * GET /api/admin/persona/staff
 * Lists all persons with linked user accounts, for staff directory management.
 */
const listStaff = async (req, res, next) => {
  try {
    const { department_id } = req.query;
    const where = {};

    if (department_id) {
      // Filter persons who have a user in that department
      const userIds = await User.findAll({
        where: { department_id },
        attributes: ['id'],
      });
      where.user_id = { [Op.in]: userIds.map((u) => u.id) };
    }

    const persons = await Person.findAll({
      where,
      include: [
        {
          model: Media,
          as: 'photo',
          attributes: ['id', 'filename', 'disk_filename', 'mime_type'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name', 'is_active'],
          include: [
            { model: Role, as: 'role', attributes: ['id', 'name'] },
            { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
          ],
        },
        {
          model: Content,
          as: 'content',
          attributes: ['id', 'slug', 'status'],
        },
      ],
      order: [['sort_order', 'ASC']],
    });

    res.json({ staff: persons });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  runWizard,
  listStaff,
};
