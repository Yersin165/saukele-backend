const contributionService = require('../services/contribution.service');

const create = async (req, res) => {
  try {
    const result = await contributionService.create(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const list = async (req, res) => {
  try {
    const { giftItemId, status, cursor, limit } = req.query;
    if (!giftItemId) return res.status(400).json({ message: 'giftItemId is required' });
    const result = await contributionService.list({ giftItemId, status, cursor, limit: parseInt(limit) || 20 });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getById = async (req, res) => {
  try {
    const contribution = await contributionService.getById(req.params.id);
    res.status(200).json(contribution);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await contributionService.updateStatus(req.params.id, status);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, list, getById, updateStatus };