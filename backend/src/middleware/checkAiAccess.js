const { User } = require('../models');
const { Op } = require('sequelize');
const Setting = require('../models/Setting');
const LlmUsageLog = require('../models/LlmUsageLog');

/**
 * AI Access Middleware
 * Checks:
 * 1. Global ai_assist_enabled setting is 'true'
 * 2. req.user.allow_ai_assist === true (fresh from DB)
 * 3. Monthly budget not exceeded
 *
 * Must be used AFTER authenticate middleware (req.user must exist).
 */
const checkAiAccess = async (req, res, next) => {
  try {
    // 1. Check global setting
    const enabledSetting = await Setting.findOne({ where: { key: 'ai_assist_enabled' } });
    if (!enabledSetting || enabledSetting.value !== 'true') {
      return res.status(403).json({
        error: 'AI Assist disabled',
        message: 'AI Assist features are disabled. Enable them in Settings.',
      });
    }

    // 2. Check per-user permission (fresh from DB)
    const user = await User.findByPk(req.user.id);
    if (!user || !user.allow_ai_assist) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to use AI Assist features. Contact your administrator.',
      });
    }

    // Attach fresh user data to request
    req.userData = user;

    // 3. Check monthly budget
    const budgetSetting = await Setting.findOne({ where: { key: 'ai_assist_monthly_budget_kes' } });
    const monthlyBudget = parseFloat(budgetSetting?.value || '0');

    if (monthlyBudget > 0) {
      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const result = await LlmUsageLog.findAll({
        where: {
          user_id: req.user.id,
          createdAt: { [Op.gte]: startOfMonth },
        },
        attributes: [
          [require('sequelize').fn('SUM', require('sequelize').col('cost_kes')), 'totalCost'],
        ],
        raw: true,
      });

      const totalCost = parseFloat(result[0]?.totalCost || '0');

      // Estimate: add a small buffer (max ~0.50 KES per request) for the current request
      const estimatedCost = totalCost + 0.50;

      if (estimatedCost > monthlyBudget) {
        return res.status(403).json({
          error: 'Budget exceeded',
          message: `Monthly AI Assist budget of KES ${monthlyBudget.toFixed(2)} has been exceeded (current: KES ${totalCost.toFixed(2)}). Contact your administrator.`,
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkAiAccess;
