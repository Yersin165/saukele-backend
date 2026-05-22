const giftService = require('../services/gift.service');

const create = async (req, res) => {
  try {
    const gift = await giftService.create(req.body);
    res.status(201).json(gift);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const list = async (req, res) => {
  try {
    let { weddingProfileId, status, cursor, limit } = req.query;
    if (!weddingProfileId && req.user.role === 'VENDOR') {
      weddingProfileId = await giftService.getVendorProductsWeddingProfileId();
    }
    if (!weddingProfileId) return res.status(400).json({ message: 'weddingProfileId is required' });
    const result = await giftService.list({ weddingProfileId, status, cursor, limit: parseInt(limit) || 20, user: req.user });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getById = async (req, res) => {
  try {
    const gift = await giftService.getById(req.params.id);
    res.status(200).json(gift);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const gift = await giftService.update(req.params.id, req.body);
    res.status(200).json(gift);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    await giftService.remove(req.params.id);
    res.status(200).json({ message: 'Gift removed' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, list, getById, update, remove };