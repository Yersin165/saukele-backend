const deliveryService = require('../services/delivery.service');

const create = async (req, res) => {
  try {
    const delivery = await deliveryService.create(req.body);
    res.status(201).json(delivery);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getById = async (req, res) => {
  try {
    const delivery = await deliveryService.getById(req.params.id);
    res.status(200).json(delivery);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const list = async (req, res) => {
  try {
    const { courierId, status, cursor, limit } = req.query;
    const result = await deliveryService.list({ courierId, status, cursor, limit: parseInt(limit) || 20 });
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const delivery = await deliveryService.updateStatus(req.params.id, status);
    res.status(200).json(delivery);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const remove = async (req, res) => {
  try {
    await deliveryService.remove(req.params.id);
    res.status(200).json({ message: 'Delivery deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { create, getById, list, updateStatus, remove };