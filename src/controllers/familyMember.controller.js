const kinshipService = require('../services/kinship.service');

const create = async (req, res) => {
  try {
    const member = await kinshipService.create(req.body);
    res.status(201).json(member);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const list = async (req, res) => {
  try {
    const { weddingProfileId, cursor, limit } = req.query;
    if (!weddingProfileId) return res.status(400).json({ message: 'weddingProfileId is required' });
    const result = await kinshipService.list({ weddingProfileId, cursor, limit: parseInt(limit) || 20 });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getTree = async (req, res) => {
  try {
    const { weddingProfileId } = req.query;
    if (!weddingProfileId) return res.status(400).json({ message: 'weddingProfileId is required' });
    const tree = await kinshipService.getTree(weddingProfileId);
    res.status(200).json(tree);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const member = await kinshipService.update(req.params.id, req.body);
    res.status(200).json(member);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    await kinshipService.remove(req.params.id);
    res.status(200).json({ message: 'Family member removed' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, list, getTree, update, remove };