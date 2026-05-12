const weddingService = require('../services/wedding.service');

const create = async (req, res) => {
  try {
    const wedding = await weddingService.create(req.user.id, req.body);
    res.status(201).json(wedding);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getById = async (req, res) => {
  try {
    const wedding = await weddingService.getById(req.params.id);
    res.status(200).json(wedding);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const wedding = await weddingService.update(req.params.id, req.body);
    res.status(200).json(wedding);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

// AFTER
const deactivate = async (req, res) => {
  try {
    const wedding = await weddingService.deactivate(req.params.id);
    res.status(200).json(wedding);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getByInviteCode = async (req, res) => {
  try {
    const wedding = await weddingService.getByInviteCode(req.params.inviteCode);
    res.status(200).json(wedding);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, getById, update, deactivate, getByInviteCode };