const vendorService = require('../services/vendor.service');

const create = async (req, res) => {
  try {
    const vendor = await vendorService.create(req.user.id, req.body);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const list = async (req, res) => {
  try {
    const { cursor, limit } = req.query;
    const result = await vendorService.list({ cursor, limit: parseInt(limit) || 20 });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getById = async (req, res) => {
  try {
    const vendor = await vendorService.getById(req.params.id);
    res.status(200).json(vendor);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const vendor = await vendorService.update(req.params.id, req.body);
    res.status(200).json(vendor);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    await vendorService.remove(req.params.id);
    res.status(200).json({ message: 'Vendor deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, list, getById, update, remove };